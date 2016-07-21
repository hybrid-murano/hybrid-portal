import logging
import json
from time import sleep
import os
import sys
try:
    import xml.etree.cElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET

from openerp import SUPERUSER_ID
from openerp import tools
from openerp.modules.module import get_module_resource
from openerp.osv import fields, osv
from openerp.tools.translate import _
from bdb import set_trace

_logger = logging.getLogger(__name__)

from openerp import http
from openerp.http import request
import werkzeug.wrappers

import novaclient.client as nova
import muranoclient.client as murano

from keystoneclient.v2_0 import client as client_v2
from keystoneclient.v3 import client as client_v3
from keystoneclient import exceptions

from six.moves.urllib import parse as urlparse

import hashlib
from datetime import datetime, timedelta, tzinfo

from . import settings

currentPath = os.path.dirname(os.path.realpath(__file__))


def _get_endpoint_region(endpoint):
    """Common function for getting the region from endpoint.

    In Keystone V3, region has been deprecated in favor of
    region_id.

    This method provides a way to get region that works for
    both Keystone V2 and V3.
    """
    return endpoint.get('region_id') or endpoint.get('region')


def get_service_from_catalog(catalog, service_type):
    if catalog:
        for service in catalog:
            if 'type' not in service:
                continue
            if service['type'] == service_type:
                return service
    return None


def get_version_from_service(service):
    if service and service.get('endpoints'):
        endpoint = service['endpoints'][0]
        if 'interface' in endpoint:
            return 3
        else:
            return 2.0
    return 2.0


# Mapping of V2 Catalog Endpoint_type to V3 Catalog Interfaces
ENDPOINT_TYPE_TO_INTERFACE = {
    'publicURL': 'public',
    'internalURL': 'internal',
    'adminURL': 'admin',
}


def get_url_for_service(service, region, endpoint_type):
    if 'type' not in service:
        return None
    identity_version = get_version_from_service(service)
    service_endpoints = service.get('endpoints', [])
    available_endpoints = [endpoint for endpoint in service_endpoints if region == _get_endpoint_region(endpoint)]
    """if we are dealing with the identity service and there is no endpoint
    in the current region, it is okay to use the first endpoint for any
    identity service endpoints and we can assume that it is global
    """
    if service['type'] == 'identity' and not available_endpoints:
        available_endpoints = [endpoint for endpoint in service_endpoints]
    for endpoint in available_endpoints:
        try:
            if identity_version < 3:
                return endpoint.get(endpoint_type)
            else:
                interface = \
                    ENDPOINT_TYPE_TO_INTERFACE.get(endpoint_type, '')
                if endpoint.get('interface') == interface:
                    return endpoint.get('url')
        except (IndexError, KeyError):
            """it could be that the current endpoint just doesn't match the
            type, continue trying the next one
            """
            pass
    return None


def url_for(request, service_type, endpoint_type=None, region=None):
    endpoint_type = endpoint_type or getattr(settings, 'OPENSTACK_ENDPOINT_TYPE', 'publicURL')
    fallback_endpoint_type = getattr(settings, 'SECONDARY_ENDPOINT_TYPE', None)
    catalog = request.user.service_catalog
    service = get_service_from_catalog(catalog, service_type)
    if service:
        if not region:
            region = request.user.services_region
        url = get_url_for_service(service, region, endpoint_type)
        if not url and fallback_endpoint_type:
            url = get_url_for_service(service,
                                      region,
                                      fallback_endpoint_type)
        if url:
            return url
    raise exceptions.EndpointException(service_type)


def check(actions, request, target=None):
    """Wrapper of the configurable policy method."""
    policy_check = getattr(settings, "POLICY_CHECK_FUNCTION", None)
    if policy_check:
        return policy_check(actions, request, target)
    return True


class APIVersionManager(object):
    """Object to store and manage API versioning data and utility methods."""
    SETTINGS_KEY = "OPENSTACK_API_VERSIONS"

    def __init__(self, service_type, preferred_version=None):
        self.service_type = service_type
        self.preferred = preferred_version
        self._active = None
        self.supported = {}
        # As a convenience, we can drop in a placeholder for APIs that we
        # have not yet needed to version. This is useful, for example, when
        # panels such as the admin metadata_defs wants to check the active
        # version even though it's not explicitly defined. Previously
        # this caused a KeyError.
        if self.preferred:
            self.supported[self.preferred] = {"version": self.preferred}

    @property
    def active(self):
        if self._active is None:
            self.get_active_version()
        return self._active

    def load_supported_version(self, version, data):
        self.supported[version] = data

    def get_active_version(self):
        if self._active is not None:
            return self.supported[self._active]
        key = getattr(settings, self.SETTINGS_KEY, {}).get(self.service_type)
        if key is None:
            # TODO(gabriel): support API version discovery here; we'll leave
            # the setting in as a way of overriding the latest available
            # version.
            key = self.preferred
        # Since we do a key lookup in the supported dict the type matters,
        # let's ensure people know if they use a string when the key isn't.
        if isinstance(key, six.string_types):
            msg = ('The version "%s" specified for the %s service should be '
                   'either an integer or a float, not a string.' %
                   (key, self.service_type))
            raise exceptions.ConfigurationError(msg)
        # Provide a helpful error message if the specified version isn't in the
        # supported list.
        if key not in self.supported:
            choices = ", ".join(str(k) for k in six.iterkeys(self.supported))
            msg = ('%s is not a supported API version for the %s service, '
                   ' choices are: %s' % (key, self.service_type, choices))
            raise exceptions.ConfigurationError(msg)
        self._active = key
        return self.supported[self._active]

    def clear_active_cache(self):
        self._active = None


# Helper for figuring out keystone version
# Implementation will change when API version discovery is available
def get_keystone_version():
    return getattr(settings, 'OPENSTACK_API_VERSIONS', {}).get('identity', 2.0)


def get_keystone_client():
    if get_keystone_version() < 3:
        return client_v2
    else:
        return client_v3


def has_in_url_path(url, sub):
    """Test if the `sub` string is in the `url` path."""
    scheme, netloc, path, query, fragment = urlparse.urlsplit(url)
    return sub in path


def url_path_replace(url, old, new, count=None):
    """Return a copy of url with replaced path.
    Return a copy of url with all occurrences of old replaced by new in the url
    path.  If the optional argument count is given, only the first count
    occurrences are replaced.
    """
    args = []
    scheme, netloc, path, query, fragment = urlparse.urlsplit(url)
    if count is not None:
        args.append(count)
    return urlparse.urlunsplit((
        scheme, netloc, path.replace(old, new, *args), query, fragment))


_PROJECT_CACHE = {}

import functools
from functools import wraps, update_wrapper, WRAPPER_ASSIGNMENTS

import sys

PY3 = sys.version_info[0] == 3


def available_attrs(fn):
    """
    Return the list of functools-wrappable attributes on a callable.
    This is required as a workaround for http://bugs.python.org/issue3445
    under Python 2.
    """
    if PY3:
        return WRAPPER_ASSIGNMENTS
    else:
        return tuple(a for a in WRAPPER_ASSIGNMENTS if hasattr(fn, a))


def memoize_by_keyword_arg(cache, kw_keys):
    """Memoize a function using the list of keyword argument name as its key.

    Wrap a function so that results for any keyword argument tuple are stored
    in 'cache'. Note that the keyword args to the function must be usable as
    dictionary keys.

    :param cache: Dictionary object to store the results.
    :param kw_keys: List of keyword arguments names. The values are used
                    for generating the key in the cache.
    """

    def _decorator(func):
        @functools.wraps(func, assigned=available_attrs(func))
        def wrapper(*args, **kwargs):
            mem_args = [kwargs[key] for key in kw_keys if key in kwargs]
            mem_args = '__'.join(str(mem_arg) for mem_arg in mem_args)
            if not mem_args:
                return func(*args, **kwargs)
            if mem_args in cache:
                return cache[mem_args]
            result = func(*args, **kwargs)
            cache[mem_args] = result
            return result

        return wrapper

    return _decorator


@memoize_by_keyword_arg(_PROJECT_CACHE, ('token',))
def get_project_list(*args, **kwargs):
    if get_keystone_version() < 3:
        auth_url = url_path_replace(
            kwargs.get('auth_url', ''), '/v3', '/v2.0', 1)
        kwargs['auth_url'] = auth_url
        client = get_keystone_client().Client(*args, **kwargs)
        projects = client.tenants.list()
    else:
        auth_url = url_path_replace(
            kwargs.get('auth_url', ''), '/v2.0', '/v3', 1)
        kwargs['auth_url'] = auth_url
        client = get_keystone_client().Client(*args, **kwargs)
        client.management_url = auth_url
        projects = client.projects.list(user=kwargs.get('user_id'))

    projects.sort(key=lambda project: project.name.lower())
    return projects


# Set up our data structure for managing Identity API versions, and
# add a couple utility methods to it.
class IdentityAPIVersionManager(APIVersionManager):
    def upgrade_v2_user(self, user):
        if getattr(user, "project_id", None) is None:
            user.project_id = getattr(user, "default_project_id",
                                      getattr(user, "tenantId", None))
        return user

    def get_project_manager(self, *args, **kwargs):
        if VERSIONS.active < 3:
            manager = keystoneclient(*args, **kwargs).tenants
        else:
            manager = keystoneclient(*args, **kwargs).projects
        return manager


VERSIONS = IdentityAPIVersionManager(
    "identity", preferred_version=get_keystone_version())

# Import from oldest to newest so that "preferred" takes correct precedence.
try:
    from keystoneclient.v2_0 import client as keystone_client_v2

    VERSIONS.load_supported_version(2.0, {"client": keystone_client_v2})
except ImportError:
    pass

try:
    from keystoneclient.v3 import client as keystone_client_v3

    VERSIONS.load_supported_version(3, {"client": keystone_client_v3})
except ImportError:
    pass


def _get_endpoint_url(request, endpoint_type, catalog=None):
    if getattr(request.user, "service_catalog", None):
        url = url_for(request, service_type='identity', endpoint_type=endpoint_type)
    else:
        auth_url = getattr(settings, 'OPENSTACK_KEYSTONE_URL')
        url = request.session.get('region_endpoint', auth_url)
    # TODO(gabriel): When the Service Catalog no longer contains API versions
    # in the endpoints this can be removed.
    url = url.rstrip('/')
    url = urlparse.urljoin(url, 'v%s' % VERSIONS.active)
    return url


KEYSTONE_CLIENT_ATTR = "_keystoneclient"


def keystoneclient(request, admin=False):
    """Returns a client connected to the Keystone backend.
    Several forms of authentication are supported:
        * Username + password -> Unscoped authentication
        * Username + password + tenant id -> Scoped authentication
        * Unscoped token -> Unscoped authentication
        * Unscoped token + tenant id -> Scoped authentication
        * Scoped token -> Scoped authentication
    Available services and data from the backend will vary depending on
    whether the authentication was scoped or unscoped.
    Lazy authentication if an ``endpoint`` parameter is provided.
    Calls requiring the admin endpoint should have ``admin=True`` passed in
    as a keyword argument.
    The client is cached so that subsequent API calls during the same
    request/response cycle don't have to be re-authenticated.
    """
    user = request.user
    if admin:
        if not policy.check((("identity", "admin_required"),), request):
            raise exceptions.AuthorizationFailure
        endpoint_type = 'adminURL'
    else:
        endpoint_type = getattr(settings, 'OPENSTACK_ENDPOINT_TYPE', 'internalURL')
    api_version = VERSIONS.get_active_version()
    # Take care of client connection caching/fetching a new client.
    # Admin vs. non-admin clients are cached separately for token matching.
    cache_attr = "_keystoneclient_admin" if admin \
        else KEYSTONE_CLIENT_ATTR
    if (hasattr(request, cache_attr) and
            (not user.token.id or
                     getattr(request, cache_attr).auth_token == user.token.id)):
        conn = getattr(request, cache_attr)
    else:
        endpoint = _get_endpoint_url(request, endpoint_type)
        insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
        cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
        _logger.debug("Creating a new keystoneclient connection to %s." % endpoint)
        remote_addr = request.environ.get('REMOTE_ADDR', '')
        conn = api_version['client'].Client(token=user.token.id,
                                            endpoint=endpoint,
                                            original_ip=remote_addr,
                                            insecure=insecure,
                                            cacert=cacert,
                                            auth_url=endpoint,
                                            debug=settings.DEBUG)
        setattr(request, cache_attr, conn)
    return conn


def muranoclient(request):
    endpoint = url_for(request, 'application_catalog')
    insecure = getattr(settings, 'MURANO_API_INSECURE', False)
    token_id = request.user.token.id
    _logger.debug('Murano::Client <Url: {0}, TokenId: {1}>'.format(endpoint, token_id))
    return murano.Client(1, endpoint=endpoint, token=token_id, insecure=insecure)


def novaclient(request):
    endpoint = url_for(request, 'compute')
    token_id = request.user.token.id
    project_id = request.user.project_id
    client = nova.Client("2", auth_token=token_id, project_id=project_id,
                         insecure=True)
    client.client.set_management_url(endpoint)
    return client


class Token(object):
    """Token object that encapsulates the auth_ref (AccessInfo)from keystone
       client.
       Added for maintaining backward compatibility with horizon that expects
       Token object in the user object.
    """

    def __init__(self, auth_ref):
        # User-related attributes
        user = {}
        user['id'] = auth_ref.user_id
        user['name'] = auth_ref.username
        self.user = user
        self.user_domain_id = auth_ref.user_domain_id
        self.user_domain_name = auth_ref.user_domain_name
        # Token-related attributes
        self.id = auth_ref.auth_token
        if len(self.id) > 64:
            algorithm = getattr(settings, 'OPENSTACK_TOKEN_HASH_ALGORITHM', 'md5')
            hasher = hashlib.new(algorithm)
            hasher.update(self.id)
            self.id = hasher.hexdigest()
        self.expires = auth_ref.expires
        # Project-related attributes
        project = {}
        project['id'] = auth_ref.project_id
        project['name'] = auth_ref.project_name
        self.project = project
        self.tenant = self.project
        # Domain-related attributes
        domain = {}
        domain['id'] = auth_ref.domain_id
        domain['name'] = auth_ref.domain_name
        self.domain = domain
        if auth_ref.version == 'v2.0':
            self.roles = auth_ref['user'].get('roles', [])
        else:
            self.roles = auth_ref.get('roles', [])
        if get_keystone_version() < 3:
            self.serviceCatalog = auth_ref.get('serviceCatalog', [])
        else:
            self.serviceCatalog = auth_ref.get('catalog', [])


class User(object):
    """A User class with some extra special sauce for Keystone.
    In addition to the standard Django user attributes, this class also has
    the following:
    .. attribute:: token
        The Keystone token object associated with the current user/tenant.
        The token object is deprecated, user auth_ref instead.
    .. attribute:: tenant_id
        The id of the Keystone tenant for the current user/token.
        The tenant_id keyword argument is deprecated, use project_id instead.
    .. attribute:: tenant_name
        The name of the Keystone tenant for the current user/token.
        The tenant_name keyword argument is deprecated, use project_name
        instead.
    .. attribute:: project_id
        The id of the Keystone project for the current user/token.
    .. attribute:: project_name
        The name of the Keystone project for the current user/token.
    .. attribute:: service_catalog
        The ``ServiceCatalog`` data returned by Keystone.
    .. attribute:: roles
        A list of dictionaries containing role names and ids as returned
        by Keystone.
    .. attribute:: services_region
        A list of non-identity service endpoint regions extracted from the
        service catalog.
    .. attribute:: user_domain_id
        The domain id of the current user.
    .. attribute:: user_domain_name
        The domain name of the current user.
    .. attribute:: domain_id
        The id of the Keystone domain scoped for the current user/token.
    """

    def __init__(self, id=None, token=None, user=None, tenant_id=None,
                 service_catalog=None, tenant_name=None, roles=None,
                 authorized_tenants=None, endpoint=None, enabled=False,
                 services_region=None, user_domain_id=None,
                 user_domain_name=None, domain_id=None, domain_name=None,
                 project_id=None, project_name=None):
        self.id = id
        self.pk = id
        self.token = token
        self.username = user
        self.user_domain_id = user_domain_id
        self.user_domain_name = user_domain_name
        self.domain_id = domain_id
        self.domain_name = domain_name
        self.project_id = project_id or tenant_id
        self.project_name = project_name or tenant_name
        self.service_catalog = service_catalog
        self._services_region = (services_region or
                                 self.default_services_region())
        self.roles = roles or []
        self.endpoint = endpoint
        self.enabled = enabled
        self._authorized_tenants = authorized_tenants
        # List of variables to be deprecated.
        self.tenant_id = self.project_id
        self.tenant_name = self.project_name

    def __unicode__(self):
        return self.username

    def __repr__(self):
        return "<%s: %s>" % (self.__class__.__name__, self.username)

    def is_token_expired(self, margin=None):
        """Determine if the token is expired.
        Returns ``True`` if the token is expired, ``False`` if not, and
        ``None`` if there is no token set.
        .. param:: margin
           A security time margin in seconds before real expiration.
           Will return ``True`` if the token expires in less than ``margin``
           seconds of time.
           A default margin can be set by the TOKEN_TIMEOUT_MARGIN in the
           django settings.
        """
        if self.token is None:
            return None
        return not is_token_valid(self.token, margin)

    def is_authenticated(self, margin=None):
        """Checks for a valid authentication.
        .. param:: margin
           A security time margin in seconds before end of authentication.
           Will return ``False`` if authentication ends in less than ``margin``
           seconds of time.
           A default margin can be set by the TOKEN_TIMEOUT_MARGIN in the
           django settings.
        """
        return (self.token is not None and
                is_token_valid(self.token, margin))

    def is_anonymous(self, margin=None):
        """Return if the user is not authenticated.
        Returns ``True`` if not authenticated,``False`` otherwise.
        .. param:: margin
           A security time margin in seconds before end of an eventual
           authentication.
           Will return ``True`` even if authenticated but that authentication
           ends in less than ``margin`` seconds of time.
           A default margin can be set by the TOKEN_TIMEOUT_MARGIN in the
           django settings.
        """
        return not self.is_authenticated(margin)

    @property
    def is_active(self):
        return self.enabled

    @property
    def is_superuser(self):
        """Evaluates whether this user has admin privileges.
        Returns ``True`` or ``False``.
        """
        return 'admin' in [role['name'].lower() for role in self.roles]

    @property
    def authorized_tenants(self):
        """Returns a memoized list of tenants this user may access."""
        insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
        ca_cert = getattr(settings, "OPENSTACK_SSL_CACERT", None)
        if self.is_authenticated() and self._authorized_tenants is None:
            endpoint = self.endpoint
            token = self.token
            try:
                self._authorized_tenants = get_project_list(
                    user_id=self.id,
                    auth_url=endpoint,
                    token=token.id,
                    insecure=insecure,
                    cacert=ca_cert,
                    debug=settings.DEBUG)
            except (keystone_exceptions.ClientException,
                    keystone_exceptions.AuthorizationFailure):
                _logger.exception('Unable to retrieve project list.')
        return self._authorized_tenants or []

    @authorized_tenants.setter
    def authorized_tenants(self, tenant_list):
        self._authorized_tenants = tenant_list

    def default_services_region(self):
        """Returns the first endpoint region for first non-identity service.
        Extracted from the service catalog.
        """
        if self.service_catalog:
            for service in self.service_catalog:
                if service['type'] == 'identity':
                    continue
                for endpoint in service['endpoints']:
                    return endpoint['region']
        return None

    @property
    def services_region(self):
        return self._services_region

    @services_region.setter
    def services_region(self, region):
        self._services_region = region

    @property
    def available_services_regions(self):
        """Returns list of unique region name values in service catalog."""
        regions = []
        if self.service_catalog:
            for service in self.service_catalog:
                if service['type'] == 'identity':
                    continue
                for endpoint in service['endpoints']:
                    if endpoint['region'] not in regions:
                        regions.append(endpoint['region'])
        return regions

    def save(*args, **kwargs):
        # Presume we can't write to Keystone.
        pass

    def delete(*args, **kwargs):
        # Presume we can't write to Keystone.
        pass

    # Check for OR'd permission rules, check that user has one of the
    # required permission.
    def has_a_matching_perm(self, perm_list, obj=None):
        """Returns True if the user has one of the specified permissions.
        If object is passed, it checks if the user has any of the required
        perms for this object.
        """
        # If there are no permissions to check, just return true
        if not perm_list:
            return True
        # Check that user has at least one of the required permissions.
        for perm in perm_list:
            if self.has_perm(perm, obj):
                return True
        return False

    # Override the default has_perms method. Allowing for more
    # complex combinations of permissions.  Will check for logical AND of
    # all top level permissions.  Will use logical OR for all first level
    # tuples (check that use has one permissions in the tuple)
    #
    # Examples:
    #   Checks for all required permissions
    #   ('openstack.roles.admin', 'openstack.roles.L3-support')
    #
    #   Checks for admin AND (L2 or L3)
    #   ('openstack.roles.admin', ('openstack.roles.L3-support',
    #                              'openstack.roles.L2-support'),)
    def has_perms(self, perm_list, obj=None):
        """Returns True if the user has all of the specified permissions.
        Tuples in the list will possess the required permissions if
        the user has a permissions matching one of the elements of
        that tuple
        """
        # If there are no permissions to check, just return true
        if not perm_list:
            return True
        for perm in perm_list:
            if isinstance(perm, basestring):
                # check that the permission matches
                if not self.has_perm(perm, obj):
                    return False
            else:
                # check that a permission in the tuple matches
                if not self.has_a_matching_perm(perm, obj):
                    return False
        return True


def create_user_from_token(token, endpoint, services_region=None):
    return User(id=token.user['id'],
                token=token,
                user=token.user['name'],
                user_domain_id=token.user_domain_id,
                # We need to consider already logged-in users with an old
                # version of Token without user_domain_name.
                user_domain_name=getattr(token, 'user_domain_name', None),
                project_id=token.project['id'],
                project_name=token.project['name'],
                domain_id=token.domain['id'],
                domain_name=token.domain['name'],
                enabled=True,
                service_catalog=token.serviceCatalog,
                roles=token.roles,
                endpoint=endpoint,
                services_region=services_region)


def now():
    """
    Returns an aware or naive datetime.datetime, depending on settings.USE_TZ.
    """
    if settings.USE_TZ:
        # timeit shows that datetime.now(tz=utc) is 24% slower
        return datetime.utcnow().replace(tzinfo=utc)
    else:
        return datetime.now()


def is_naive(value):
    """
    Determines if a given datetime.datetime is naive.
    The logic is described in Python's docs:
    http://docs.python.org/library/datetime.html#datetime.tzinfo
    """
    return value.tzinfo is None or value.tzinfo.utcoffset(value) is None


try:
    import pytz
except ImportError:
    pytz = None

utc = pytz.utc if pytz else UTC()
"""UTC time zone as a tzinfo instance."""

# UTC and local time zones

ZERO = timedelta(0)


class UTC(tzinfo):
    """
    UTC implementation taken from Python's docs.
    Used only when pytz isn't available.
    """

    def __repr__(self):
        return "<UTC>"

    def utcoffset(self, dt):
        return ZERO

    def tzname(self, dt):
        return "UTC"

    def dst(self, dt):
        return ZERO


def make_aware(value, timezone):
    """
    Makes a naive datetime.datetime in a given time zone aware.
    """
    if hasattr(timezone, 'localize'):
        # available for pytz time zones
        return timezone.localize(value, is_dst=None)
    else:
        # may be wrong around DST changes
        return value.replace(tzinfo=timezone)


def is_token_valid(token, margin=None):
    """Timezone-aware checking of the auth token's expiration timestamp.
    Returns ``True`` if the token has not yet expired, otherwise ``False``.
    .. param:: token
       The openstack_auth.user.Token instance to check
    .. param:: margin
       A time margin in seconds to subtract from the real token's validity.
       An example usage is that the token can be valid once the middleware
       passed, and invalid (timed-out) during a view rendering and this
       generates authorization errors during the view rendering.
       A default margin can be set by the TOKEN_TIMEOUT_MARGIN in the
       django settings.
    """
    expiration = token.expires
    # In case we get an unparseable expiration timestamp, return False
    # so you can't have a "forever" token just by breaking the expires param.
    if expiration is None:
        return False
    if margin is None:
        margin = getattr(settings, 'TOKEN_TIMEOUT_MARGIN', 0)
    expiration = expiration - timedelta(seconds=margin)
    if settings.USE_TZ and is_naive(expiration):
        # Presumes that the Keystone is using UTC.
        expiration = make_aware(expiration, utc)
    return expiration > now()


def check_auth_expiry(auth_ref, margin=None):
    if not is_token_valid(auth_ref, margin):
        msg = _("The authentication token issued by the Identity service "
                "has expired.")
        _logger.warning("The authentication token issued by the Identity "
                        "service appears to have expired before it was "
                        "issued. This may indicate a problem with either your "
                        "server or client configuration.")
        raise exceptions.ValidationError(msg)
    return True


def authenticate(request=None, username=None, password=None, user_domain_name=None, auth_url=None, region=None):
    """Authenticates a user via the Keystone Identity API."""
    _logger.debug('Beginning user authentication for user "%s".' % username)
    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
    ca_cert = getattr(settings, "OPENSTACK_SSL_CACERT", None)
    endpoint_type = getattr(settings, 'OPENSTACK_ENDPOINT_TYPE', 'publicURL')
    # keystone client v3 does not support logging in on the v2 url any more
    if get_keystone_version() >= 3:
        if has_in_url_path(auth_url, "/v2.0"):
            _logger.warning("The settings.py file points to a v2.0 keystone "
                            "endpoint, but v3 is specified as the API version "
                            "to use. Using v3 endpoint for authentication.")
            auth_url = url_path_replace(auth_url, "/v2.0", "/v3", 1)
    keystone_client = get_keystone_client()
    try:
        client = keystone_client.Client(
            user_domain_name=user_domain_name,
            username=username,
            password=password,
            region_name=region,
            auth_url=auth_url,
            insecure=insecure,
            cacert=ca_cert,
            debug=settings.DEBUG)
        unscoped_auth_ref = client.auth_ref
        unscoped_token = Token(auth_ref=unscoped_auth_ref)
    except (exceptions.Unauthorized,
            exceptions.Forbidden,
            exceptions.NotFound) as exc:
        msg = _('Invalid user name or password.')
        _logger.debug(str(exc))
        raise exceptions.ValidationError(msg)
    except (exceptions.ClientException,
            exceptions.AuthorizationFailure) as exc:
        msg = _("An error occurred authenticating. "
                "Please try again later.")
        _logger.debug(str(exc))
        raise exceptions.ValidationError(msg)
    # Check expiry for our unscoped auth ref.
    check_auth_expiry(unscoped_auth_ref)
    # Check if token is automatically scoped to default_project
    if unscoped_auth_ref.project_scoped:
        auth_ref = unscoped_auth_ref
    else:
        # For now we list all the user's projects and iterate through.
        try:
            if get_keystone_version() < 3:
                projects = client.tenants.list()
            else:
                client.management_url = auth_url
                projects = client.projects.list(
                    user=unscoped_auth_ref.user_id)
        except (exceptions.ClientException,
                exceptions.AuthorizationFailure) as exc:
            msg = _('Unable to retrieve authorized projects.')
            raise exceptions.ValidationError(msg)
        # Abort if there are no projects for this user
        if not projects:
            msg = _('You are not authorized for any projects.')
            raise exceptions.ValidationError(msg)
        while projects:
            project = projects.pop()
            try:
                client = keystone_client.Client(
                    tenant_id=project.id,
                    token=unscoped_auth_ref.auth_token,
                    auth_url=auth_url,
                    region_name=region,
                    insecure=insecure,
                    cacert=ca_cert,
                    debug=settings.DEBUG)
                auth_ref = client.auth_ref
                break
            except (exceptions.ClientException,
                    exceptions.AuthorizationFailure):
                auth_ref = None
        if auth_ref is None:
            msg = _("Unable to authenticate to any available projects.")
            raise exceptions.ValidationError(msg)
    # Check expiry for our new scoped token.
    check_auth_expiry(auth_ref)
    # If we made it here we succeeded. Create our User!
    user = create_user_from_token(Token(auth_ref), client.service_catalog.url_for(endpoint_type=endpoint_type), region)
    if request is not None:
        request.session['unscoped_token'] = unscoped_token.id
        request.user = user
        # Support client caching to save on auth calls.
        setattr(request, KEYSTONE_CLIENT_ATTR, client)
    _logger.debug('Authentication completed for user "%s".' % username)
    return user

_ISO8601_TIME_FORMAT_SUBSECOND = '%Y-%m-%dT%H:%M:%S.%f'


def getCount(masternode_ip, mininodes_ip):
    instance = 0
    try:
        r = os.popen('curl --connect-timeout 3 %s:8080/api/v1/namespaces/default/pods 2>/dev/null' % (masternode_ip)).read()
        pods = json.loads(r)
        for pod in pods['items']:
            if pod['spec']['nodeName'] in mininodes_ip:
                instance = instance + 1
        return instance
    except Exception:
        return instance

import eventlet
def getCpu(masternode_ip, mininodes_ip):
    def getOneCpu(ip):
        _logger.info('process {0}-{1}'.format(masternode_ip, ip))
    #        for ip in mininodes_ip:
        r = os.popen('curl --connect-timeout 3 %s:8080/api/v1/proxy/nodes/%s:4194/api/v1.0/containers/ 2>/dev/null' % (masternode_ip, ip)).read()
        cpu = json.loads(r)
        t = cpu['stats'][0]['timestamp']
        mch = json.loads(os.popen('curl --connect-timeout 3 %s:8080/api/v1/proxy/nodes/%s:4194/api/v1.0/machine 2>/dev/null' % (masternode_ip, ip)).read())
        if "has_cpu" not in cpu["spec"]:
            loads.append(None)
        stl = len(cpu['stats'])
        i=1
        total = 0.0
        cpuUsage = 0.0
        while i < stl:
            cur = cpu['stats'][i]
            pre = cpu['stats'][i-1]
            rawUsage = cur['cpu']['usage']['total'] - pre['cpu']['usage']['total']
            interval = datetime.strptime(cur['timestamp'][:-4], _ISO8601_TIME_FORMAT_SUBSECOND) - datetime.strptime(pre['timestamp'][:-4], _ISO8601_TIME_FORMAT_SUBSECOND)
            interval = interval.seconds*1000000000 + interval.microseconds*1000
            cpuUsage = ((rawUsage*1.0 / interval) / mch['num_cores']) * 100
            if cpuUsage > 100:
                cpuUsage = 100.0
            total += cpuUsage
            i += 1
        return total / (stl-1)
        
    try:
        pool = eventlet.GreenPool()
        loads = list(pool.imap(getOneCpu, mininodes_ip))

        count = 0
        cpu_load = 0.0
        for load in loads:
            if load is not None:
                cpu_load += load
                count += 1
        return "%.2f%%" % (cpu_load/count)
    except Exception:
        return " %"


class Openstack(http.Controller):
    global_backend = {}  # {"instance_id": {backend}}
    global_meter_result = {}  # {stats:[timestamp: [{cluster: meter}]]]}
    global_cluster = ['']  # {cluter: target}
    #global_users = 5
    #global_freq = 5
    #global_throughput = 10

    fip_shenzhen = ''
    ip_shenzhen = ''
    dockers = [{'az':'', 'docker':['','']},{'az':'', 'docker':['','']}]
    loads = {}
    vip = ''
    vm_ip = ['', '', '...']
    vm_az = ['', '', '...']
    cur_model = 'model2d3v'

    @classmethod
    def web_nova_client(cls, request):
        if not hasattr(request, "user"):
            try:
                domain = getattr(settings, 'OPENSTACK_KEYSTONE_DEFAULT_DOMAIN', 'Default')
                username = settings.OS_USERNAME
                password = settings.OS_PASSWORD
                endpoint = settings.OPENSTACK_KEYSTONE_URL
                region = settings.OPENSTACK_DEFAULT_REGION
                authenticate(request, username, password, domain, endpoint, region)
                msg = 'Login successful for user "%(username)s".' % {'username': username}
                _logger.info(msg)
            except exceptions.ValidationError as exc:
                msg = 'Login failed for user "%(username)s".' % {'username': username}
                _logger.warning(msg)
                if request.session:
                    request.session.flush()
                raise exc
        client = novaclient(request)
        return client

    @classmethod
    def web_murano_client(cls, request):
        if not hasattr(request, "user"):
            try:
                domain = getattr(settings, 'OPENSTACK_KEYSTONE_DEFAULT_DOMAIN', 'Default')
                username = settings.OS_USERNAME
                password = settings.OS_PASSWORD
                endpoint = settings.OPENSTACK_KEYSTONE_URL
                region = settings.OPENSTACK_DEFAULT_REGION
                authenticate(request, username, password, domain, endpoint, region)
                msg = 'Login successful for user "%(username)s".' % {'username': username}
                _logger.info(msg)
            except exceptions.ValidationError as exc:
                msg = 'Login failed for user "%(username)s".' % {'username': username}
                _logger.warning(msg)
                if request.session:
                    request.session.flush()
                raise exc

        client = muranoclient(request)
        return client

    @http.route('/api/get_cpu', type='http', auth='none')
    def get_cpu(self, **kwargs):
        nova_client = self.web_nova_client(request)
        murano_client = self.web_murano_client(request)
        env_id = kwargs["env_id"]
        env = murano_client.environments.get(env_id)
        services = env.services
        # tasks = []
        frontend = []
        backend = []
        cluster = []
        # if self.frontends.get(env_id, None) is not None:
        #     return json.dumps({"frontend": self.frontends[env_id],
        #                        "backend": self.backends[env_id]})
        dockers = []
        for service in services:
            if service.get("masterNode", None) is not None:
                masternode_ip = service["masterNode"]["instance"]["floatingIpAddress"]
                for az in service["availabilityZones"]:
                    kubernetesCluster = service["?"]["id"]
                    scale_service = ""
                    for s in services:
                        if s.get("autoscale", None) is not None and s.get("kubernetesCluster", None)==kubernetesCluster:
                            scale_service = s["name"]
                    # action_id = "%s_getCpuLoad" % service["?"]["id"]
                    # task_id = ""
                    # task_tries = 40
                    # while task_tries > 0:
                    #     try:
                    #         task_id = murano_client.actions.call(env_id, action_id)
                    #         break
                    #     except Exception:
                    #         sleep(5)
                    #         task_tries -= 1
                    self.fip_shenzhen = service["masterNode"]["instance"]["floatingIpAddress"]
                    self.ip_shenzhen = service["masterNode"]["instance"]["ipAddresses"][0]
#cyj                    floatingIpAddress = service["masterNode"]["instance"]["ipAddresses"][0]
                    mininodes = service["minionNodes"]
                    mininodes_ip = []
                    nodeCount = 0
                    instance = 0
                    docker = []
                    for mininode in mininodes:
                        if mininode["instance"]["availabilityZone"] == az:
                            if len(mininode["instance"]["ipAddresses"]) > 0:
                                ip = mininode["instance"]["ipAddresses"][0]
                                mininodes_ip.append(ip)
                                if nodeCount < 2:
                                    docker.append(ip)
                                nodeCount = nodeCount + 1
                    docker.append('')
                    docker.append('')
                    dockers.append({'az':az,'docker':docker})
                    instance = getCount(masternode_ip, mininodes_ip)
                    load = getCpu(masternode_ip, mininodes_ip)
                    self.loads[scale_service] = self.loads.get(scale_service, {})
                    self.loads[scale_service][az] = load
                    frontend.append({"instance": instance,
                                     "nodeCount": nodeCount,
                                     "load": load,
                                     "az": az.split(".")[0],
                                     "region": az.split(".")[1],
                                     "scale_service": scale_service,
                                     "name": service["name"],
                                     "ip": masternode_ip})
        return json.dumps({"valid": True, "frontend": frontend})

    @http.route('/api/get_status', type='http', auth='none')
    def get_status(self, **kwargs):
        nova_client = self.web_nova_client(request)
        murano_client = self.web_murano_client(request)
        env_id = kwargs["env_id"]
        env = murano_client.environments.get(env_id)
        services = env.services
        # tasks = []
        frontend = []
        backend = []
        cluster = []
        # if self.frontends.get(env_id, None) is not None:
        #     return json.dumps({"frontend": self.frontends[env_id],
        #                        "backend": self.backends[env_id]})
        dockers = []
        for service in services:
#            if service.get("lb_id", None) is not None:
#                self.cur_model = 'model1v1v'
#                self.fip_shenzhen = service.get("eip", "")
#                self.global_cluster = [ env.name ]
#            if service["?"]["type"] == "io.murano.apps.huawei.EmallBackend":
#                az = service["instance"]["availabilityZone"]
#                backend.append({"inst": service["name"],
#                    "region": az.split(".")[1],
#                    "az": az.split(".")[0],
#                    "status": "active",
#                    "instance_id": service["instance"]["?"]["id"]})
#            if service.get("emallNodes", None) is not None:
#                docker = []
#                az = service["emallNodes"][0]["availabilityZone"]
#                nodeCount = 0
#                for node in service["emallNodes"]:
#                    docker.append(node["ipAddresses"][0])
#                    nodeCount = nodeCount 
#                docker.append('')
#                docker.append('')
#                dockers.append({'az':az,'docker':docker})
#                frontend.append({"instance": 0,
#                                 "nodeCount": nodeCount,
#                                 "az": az.split(".")[0],
#                                 "region": az.split(".")[1],
#                                 "scale_service": self.global_cluster[0],
#                                 "name": service["name"]
#                                 })
            if service.get("masterNode", None) is not None:
                self.cur_model = 'model2d3v'
                masternode_ip = service["masterNode"]["instance"]["floatingIpAddress"]
                for az in service["availabilityZones"]:
                    kubernetesCluster = service["?"]["id"]
                    scale_service = ""
                    for s in services:
                        if s.get("autoscale", None) is not None and s.get("kubernetesCluster", None)==kubernetesCluster:
                            scale_service = s["name"]
                    # action_id = "%s_getCpuLoad" % service["?"]["id"]
                    # task_id = ""
                    # task_tries = 40
                    # while task_tries > 0:
                    #     try:
                    #         task_id = murano_client.actions.call(env_id, action_id)
                    #         break
                    #     except Exception:
                    #         sleep(5)
                    #         task_tries -= 1
                    self.fip_shenzhen = service["masterNode"]["instance"]["floatingIpAddress"]
                    self.ip_shenzhen = service["masterNode"]["instance"]["ipAddresses"][0]
#cyj                    floatingIpAddress = service["masterNode"]["instance"]["ipAddresses"][0]
                    mininodes = service["minionNodes"]
                    mininodes_ip = []
                    nodeCount = 0
                    instance = 0
                    docker = []
                    for mininode in mininodes:
                        if mininode["instance"]["availabilityZone"] == az:
                            if len(mininode["instance"]["ipAddresses"]) > 0:
                                ip = mininode["instance"]["ipAddresses"][0]
                                mininodes_ip.append(ip)
                                if nodeCount < 2:
                                    docker.append(ip)
                                nodeCount = nodeCount + 1
                    docker.append('')
                    docker.append('')
                    dockers.append({'az':az,'docker':docker})
                    instance = getCount(masternode_ip, mininodes_ip)
                    try:
                        load = self.loads[scale_service][az]
                    except Exception:
                        load = " %"
                    frontend.append({"instance": instance,
                                     "nodeCount": nodeCount,
                                     "load": load,
                                     "az": az.split(".")[0],
                                     "region": az.split(".")[1],
                                     "scale_service": scale_service,
                                     "name": service["name"],
                                     "ip": masternode_ip})
                cluster.append(service["name"])
                #tasks.append(task_id)
            insts = service.get("instance_uuids", None)
            if insts is not None:
                self.vip = service.get("vip", self.vip)
                idx = 0
                for node in service.get("emallNodes", []):
                    self.vm_ip[idx] = node["ipAddresses"][0]
                    self.vm_az[idx] = node["availabilityZone"]
                    if idx > 1:
                        break
                    idx = idx + 1
            for node in service.get("instance_uuids", []):
                az = node["az"]
                instance_uuid = node["id"]
                name = node["name"]
                try:
                    server = nova_client.servers.get(instance_uuid)
                    #status = server.status
                    if server.status == "ACTIVE":
                        if getattr(server, 'OS-EXT-STS:task_state') is not None:
                            status = getattr(server, 'OS-EXT-STS:task_state').lower()
                        else:
                            status = "active"
                    else:
                        if getattr(server, 'OS-EXT-STS:task_state') is not None:
                            status = getattr(server, 'OS-EXT-STS:task_state').lower()
                        else:
                            status = server.status.lower()
                except Exception:
                    status = "error"
                #if self.global_backend.get(instance_uuid) is not None:
                    #if status == "active":
                    #    if self.global_backend.get(instance_uuid)["status"] == "standby":
                    #        status = "standby"
                backend.append({"inst": name,
                                "region": az.split(".")[1],
                                "az": az.split(".")[0],
                                "status": status,
                                "instance_id": instance_uuid})
        dockers.append({'az':'','docker':['','']})
        dockers.append({'az':'','docker':['','']})
        _logger.info('docker info is {0}'.format(dockers))
        self.dockers = dockers
            # self.global_backend = backend
        # for index, task_id in enumerate(tasks):
        #     if task_id != "":
        #         result_tries = 40
        #         while result_tries > 0:
        #             result = murano_client.actions.get_result(env_id, task_id)
        #             if result is not None:
        #                 frontend[index]["load"] = result["result"]
        #                 break
        #             sleep(5)
        #             result_tries -= 1

        # self.frontends[env_id] = frontend
        # self.backends[env_id] = backend
        
        #if len(backend) == 2:
        #    if backend[0]["status"] == "active" and backend[1]["status"] == "active":
        #        backend[1]["status"] = "standby" 
        for item in backend:
            self.global_backend[item["instance_id"]] = item

        if len(cluster) > 0:
            self.global_cluster = cluster
        else:
            _logger.warn('no cluster found')
        if len(self.global_meter_result):
            self.global_meter_result["stats"] = []
            now = datetime.utcnow()
            for i in range(10):
                timestamp = str(now - timedelta(seconds=i*15)).replace(" ", "T")
                meter = {}
                for c in self.global_cluster:
                    meter[c] = 0
                self.global_meter_result["stats"].append({
                    "timestamp": timestamp,
                    "meter": meter})
        
        return json.dumps({"valid": True,
                           "frontend": frontend,
                           "backend": backend})

    @http.route('/api/scaleRcUp', type='http', auth='none')
    def get_scaleRcUp(self, **kwargs):
        client = self.web_murano_client(request)
        env_id = kwargs['env_id']
        service_name = kwargs['service_name']
        az = kwargs['az']
        env = client.environments.get(env_id)
        services = env.services
        for service in services:
            if service["name"] == service_name:
                action_id = "%s_scaleRcUp" % service["?"]["id"]
                task_id = ""
                task_tries = 40
                while task_tries > 0:
                    try:
                        task_id = client.actions.call(env_id, action_id)
                        break
                    except Exception:
                        task_tries -= 1
                        sleep(5)
                if task_id == "":
                    return "Failed"
                tries = 40
                while tries > 0:
                    result = client.actions.get_result(env_id, task_id)
                    if result is not None:
                        if result['isException'] is False:
                            return "Success"
                        else:
                            return "Failed"
                    sleep(5)
                    tries -= 1
        return "Failed"

    @http.route('/api/scaleRcDown', type='http', auth='none')
    def get_scaleRcDown(self, **kwargs):
        client = self.web_murano_client(request)
        env_id = kwargs['env_id']
        service_name = kwargs['service_name']
        az = kwargs['az']
        env = client.environments.get(env_id)
        services = env.services
        for service in services:
            if service["name"] == service_name:
                action_id = "%s_scaleRcDown" % service["?"]["id"]
                task_id = ""
                task_tries = 40
                while task_tries > 0:
                    try:
                        task_id = client.actions.call(env_id, action_id)
                        break
                    except Exception:
                        task_tries -= 1
                        sleep(5)
                if task_id == "":
                    return "Failed"
                tries = 40
                while tries > 0:
                    result = client.actions.get_result(env_id, task_id)
                    if result is not None:
                        if result['isException'] is False:
                            return "Success"
                        else:
                            return "Failed"
                    sleep(5)
                    tries -= 1
        return "Failed"

    @http.route('/api/stop', type='http', auth='none')
    def stop(self, **kwargs):
        # backend_0 = self.global_backend[0]
        # backend_1 = self.global_backend[1]
        nova_client = self.web_nova_client(request)
        instance_id = kwargs["instance_id"]
        server = nova_client.servers.get(instance_id)
        if server.status != "ACTIVE":
            return "stopped"
        nova_client.servers.stop(instance_id)
        #for id, item in self.global_backend.items():
        #    if id == instance_id:
        #        item["status"] == 'powerinf-off'
        #    else:
        #        if item["status"] == "standby":
        #            item["status"] == "active"
        # self.global_backend[instance_id]["status"] == "powering-off"
        # if backend_0["instance_id"] == instance_id:
        #     backend_0["status"] = "shutdown"
        # else:
        #     backend_1["status"] = "shutdown"
        return "stopping"

    @http.route('/api/start', type='http', auth='none')
    def start(self, **kwargs):
        # backend_0 = self.global_backend[0]
        # backend_1 = self.global_backend[1]
        nova_client = self.web_nova_client(request)
        instance_id = kwargs["instance_id"]
        server = nova_client.servers.get(instance_id)
        if server.status == "ACTIVE":
            return "started"
        nova_client.servers.start(instance_id)
        #self.global_backend[instance_id]["status"] == "powering-on"
        return "starting"

    @http.route('/api/turn_over', type='http', auth='none')
    def turn_over(self, **kwargs):
        env_id = kwargs["env_id"]
        #if len(self.global_backend) < 2:
        #    return json.dumps({"backend": self.global_backend.values()})
        #backend_0 = self.global_backend.values()[0]
        #backend_1 = self.global_backend.values()[1]
        #if backend_0["status"] == "active":
        #    if backend_1["status"] == "standby":
        #        backend_0["status"] = "standby"
        #        backend_1["status"] = "active"
        #elif backend_0["status"] == "standby":
        #    if backend_1["status"] == "active":
        #        backend_0["status"] = "active"
        #        backend_1["status"] = "standby"
        return json.dumps({"backend": self.global_backend[env_id]})

    @http.route('/api/meter_stop', type='http', auth="none")
    def meter_stop(self, s_action=None, **kw):
        if request.httprequest.method == 'POST':
            address = kw.get('address')
            cluster = kw.get('cluster')
            _logger.debug('stop:{0}, {1}, {2}'.format(address))
            os.system("ps -ef|grep jmeter | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            return '{"ret": "success"}'

    @http.route('/api/meter_restart', type='http', auth="none")
    def restart(self, s_action=None, **kw):
        env_id = kw['env_id']
        if request.httprequest.method == 'POST':
            users = kw.get('users')
            freq = kw.get('freq')
            throughput = kw.get('throughput')
            #self.global_users = users
            #self.global_freq = freq
            #self.global_throughput = throughput
            address = kw.get('address')
            cluster = kw.get('cluster')
            _logger.debug('restart:{0}, {1}, {2}, {3}'.format(users, freq, throughput, address))
            currentPath = os.path.dirname(os.path.realpath(__file__))
            # logfile = '%s/%s.xml' % (currentPath, address)
            f = currentPath + '/meter.jmx'
            tree = ET.parse(f)
            root = tree.getroot()
            for child in root.iter('stringProp'):
                if child.attrib['name'] == "ThreadGroup.num_threads":
                    child.text = users
                elif child.attrib['name'] == "ThreadGroup.ramp_time":
                    child.text = freq
                elif child.attrib['name'] == "HTTPSampler.domain":
                    child.text = address
                elif child.attrib['name'] == "HTTPSampler.port":
                    child.text = '80'
                elif child.attrib['name'] == "filename":
                    child.text = currentPath + '/' + cluster + '.xml'
                else:
                    continue
            for child in root.iter('doubleProp'):
                for val in child.iter('value'):
                    val.text = throughput
            tree.write(f)
            os.system("ps -ef|grep jmeter | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            os.system('jmeter -n -t %s &' % f)
            os.system("ps -ef|grep sync_meter_result | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            command = 'python %s/%s %s' % (currentPath, 'sync_meter_result.py', env_id)
            for c in self.global_cluster:
                command = "%s %s" % (command, c)
            os.system("%s &" % command)
            return '{"ret": "success"}'
 
    @http.route('/api/get_envs', type='http', auth='none')
    def get_envs(self, **kwargs):
        murano_client = self.web_murano_client(request)
        envs = murano_client.environments.list(all_tenants=True)
        env_list = []
        for env in envs:
            env_list.append({"name": env.name,
                             "id": env.id})
        return json.dumps(env_list)

    @http.route('/api/sync_meter', type='http', auth="none")
    def meter(self, s_action=None, **kw):
        env_id = kw['env_id']
        currentPath = os.path.dirname(os.path.realpath(__file__))
        meter_result_file = "%s/%s_result_new" % (currentPath, env_id)
        if os.path.exists(meter_result_file) is False:
            return json.dumps(self.global_meter_result)
        with open(meter_result_file, "r") as f:
            sync_result = json.load(f)
        self.global_meter_result["stats"] = sync_result
        return json.dumps(self.global_meter_result)

    @http.route('/api/model', type='http', auth="none")
    def model(self, s_action=None, **kw):
        from string import Template
        models = {
            'model2d3v': '{"resourceId":"canvas1","properties":{"name":"","documentation":"","process_id":"process","process_author":"","process_executable":"Yes","process_version":"","process_namespace":"http://www.activiti.org/processdef","executionlisteners":"","eventlisteners":"","dataproperties":""},"stencil":{"id":"BPMNDiagram"},"childShapes":[{"resourceId":"oryx_34DC689D-37A4-4C3C-AE17-A5DABC4B4127","properties":{"overrideid":"","name":"","documentation":"","formproperties":"","initiator":"","formkeydefinition":"","executionlisteners":""},"stencil":{"id":"StartNoneEvent"},"childShapes":[],"outgoing":[{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E"},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E"}],"bounds":{"lowerRight":{"x":267.5,"y":45},"upperLeft":{"x":237.5,"y":15}},"dockers":[]},{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}],"bounds":{"lowerRight":{"x":241.93055210941756,"y":96.44605205460505},"upperLeft":{"x":192.36632289058244,"y":41.67894794539496}},"dockers":[{"x":15,"y":15},{"x":92,"y":33.5}],"target":{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}],"bounds":{"lowerRight":{"x":317.64382141764037,"y":96.4732871608575},"upperLeft":{"x":263.15305358235963,"y":40.870462839142505}},"dockers":[{"x":15,"y":15},{"x":85.50000000000001,"y":33}],"target":{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}},{"resourceId":"oryx_A2C1089D-0E33-4552-B3DE-1A49072E35F7","properties":{"overrideid":"","name":"$cluster1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55","properties":{"overrideid":"","name":"$az1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_9742BA28-E1A5-4B01-8357-162C4F54A741","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61.5},"upperLeft":{"x":105,"y":21.5}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB"}],"bounds":{"lowerRight":{"x":199,"y":101.5},"upperLeft":{"x":15,"y":34.5}},"dockers":[]},{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245","properties":{"overrideid":"","name":"$az2","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_D34C6ADF-58F3-4012-856F-A3694C05D586","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":61,"y":61},"upperLeft":{"x":21,"y":21}},"dockers":[]},{"resourceId":"oryx_A991DA22-BC01-4E6B-BFE4-26E07A2C9DC0","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61},"upperLeft":{"x":105,"y":21}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2"}],"bounds":{"lowerRight":{"x":381,"y":101},"upperLeft":{"x":210,"y":35}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":450,"y":175},"upperLeft":{"x":55,"y":62}},"dockers":[]},{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"ParallelGateway"},"childShapes":[],"outgoing":[{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D"},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248"},{"resourceId":"oryx_3537731F-4593-47FB-8B2C-F26477115B30"}],"bounds":{"lowerRight":{"x":292.5,"y":234.25},"upperLeft":{"x":252.5,"y":194.25}},"dockers":[]},{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB","properties":{"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":261.34539982852186,"y":205.7452482855472},"upperLeft":{"x":205.95928767147817,"y":163.5164704644528}},"dockers":[{"x":92,"y":33.5},{"x":20,"y":20}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":320.15719429761276,"y":204.08039251416363},"upperLeft":{"x":282.75686820238724,"y":163.18132623583637}},"dockers":[{"x":85.50000000000001,"y":33},{"x":20.5,"y":20.5}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}],"bounds":{"lowerRight":{"x":258.5370486469256,"y":271.4169745019199},"upperLeft":{"x":152.91998260307443,"y":221.57521299808008}},"dockers":[{"x":20.5,"y":20.5},{"x":14,"y":14}],"target":{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}},{"resourceId":"oryx_7B06C092-8F54-4A09-8E47-0953BDB0B47E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":134,"y":48.5},"upperLeft":{"x":106,"y":20.5}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":184.5,"y":313.25},"upperLeft":{"x":19.5,"y":243.25}},"dockers":[]},{"resourceId":"oryx_CACD8AB1-7EBD-4848-91E0-9110D676458E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_8FA76418-B008-4272-A62D-D338E7BEE1B5","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":54,"y":48.75},"upperLeft":{"x":26,"y":20.75}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":361.5,"y":315.75},"upperLeft":{"x":196.5,"y":245.75}},"dockers":[]},{"resourceId":"oryx_B58A2F27-0751-4133-966B-5EF145E199DE","properties":{"overrideid":"","name":"$az3","documentation":"","text":"az01"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":132.5,"y":283.25},"upperLeft":{"x":32.5,"y":233.25}},"dockers":[]},{"resourceId":"oryx_20D0A43E-AE44-43CD-A19A-74132BFB7BAF","properties":{"overrideid":"","name":"$az4","documentation":"","text":"az11"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":329,"y":283.25},"upperLeft":{"x":229,"y":233.25}},"dockers":[]},{"resourceId":"oryx_EF156864-C6CC-4D46-AF64-07183D51DD80","properties":{"overrideid":"","name":"FIP: $fip_shenzhen","documentation":"","text":"FIP:205."},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":410.5,"y":45.25},"upperLeft":{"x":265.5,"y":2.25}},"dockers":[]},{"resourceId":"oryx_E6E487F8-72E8-42F1-B00F-4563DF713885","properties":{"overrideid":"","name":"$ip_shenzhen","documentation":"","text":"10.0.0.27"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":365.5,"y":65},"upperLeft":{"x":265.5,"y":15}},"dockers":[]},{"resourceId":"oryx_D62D21F4-DD55-44FA-B431-2CDE215174D8","properties":{"overrideid":"","name":"VIP: $vip","documentation":"","text":""},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":385.5,"y":239.25},"upperLeft":{"x":285.5,"y":189.25}},"dockers":[]},{"resourceId":"oryx_7A48A4BD-ED42-4010-9F3A-B132A6B3ED41","properties":{"overrideid":"","name":"$vm_az01","documentation":"","text":"10.0.0.14"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":152,"y":332},"upperLeft":{"x":52,"y":285}},"dockers":[]},{"resourceId":"oryx_7263AA74-C391-42B7-9FC2-2DE7C38B10B3","properties":{"overrideid":"","name":"$vm_az11","documentation":"","text":"10.0.0.15"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":326.5,"y":335},"upperLeft":{"x":226.5,"y":285}},"dockers":[]},{"resourceId":"oryx_49BBB1A0-99AE-40D5-9589-30EC06269A3A","properties":{"overrideid":"","name":"$shenzhen1","documentation":"","text":"10.0.0.28"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":170,"y":182.625},"upperLeft":{"x":70,"y":132.625}},"dockers":[]},{"resourceId":"oryx_547375F0-4946-44F3-A2BB-474A93EFE0F3","properties":{"overrideid":"","name":"$shenzhen2","documentation":"","text":"10.0.0.29"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":258.5,"y":183.25},"upperLeft":{"x":158.5,"y":133.25}},"dockers":[]},{"resourceId":"oryx_8110E8CC-040B-4691-AE3E-8F64BEBF384C","properties":{"overrideid":"","name":"$shenzhen3","documentation":"","text":"10.0.0.30"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":365.5,"y":175},"upperLeft":{"x":265.5,"y":125}},"dockers":[]},{"resourceId":"oryx_6C3CA1A0-F2CD-497A-AB25-DEE4B27F5C70","properties":{"overrideid":"","name":"$shenzhen4","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":460,"y":175},"upperLeft":{"x":360,"y":125}},"dockers":[]},{"resourceId":"oryx_DD6F5A9E-AD94-47C3-8F21-4ACF6EDCF3DD","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":137.5,"y":157.375},"upperLeft":{"x":97.5,"y":117.375}},"dockers":[]},{"resourceId":"oryx_948AA0D9-6A10-49C3-AFA8-7636C8801CAF","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_B1E5F056-BF0D-4D5F-ABAF-08C722F57EBA","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":54,"y":48.75},"upperLeft":{"x":26,"y":20.75}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":540,"y":312.375},"upperLeft":{"x":375,"y":242.375}},"dockers":[]},{"resourceId":"oryx_3DD9A007-A705-444E-A02A-A3C8E19DC952","properties":{"overrideid":"","name":"$vm_az02","documentation":"","text":"10.0.0.15"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":485,"y":331.625},"upperLeft":{"x":385,"y":281.625}},"dockers":[]},{"resourceId":"oryx_C71DF121-B5C3-4811-A685-2A77E21EE4FB","properties":{"overrideid":"","name":"$az5","documentation":"","text":"az11"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":510,"y":279.875},"upperLeft":{"x":410,"y":229.875}},"dockers":[]},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"Association"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":264.73487257488773,"y":273},"upperLeft":{"x":235,"y":227.41957032928389}},"dockers":[{"x":20.5,"y":20.5},{"x":235,"y":273}]},{"resourceId":"oryx_3537731F-4593-47FB-8B2C-F26477115B30","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"Association"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":405,"y":264},"upperLeft":{"x":287.3431612670644,"y":220.10152039699182}},"dockers":[{"x":20.5,"y":20.5},{"x":405,"y":264}]}],"bounds":{"lowerRight":{"x":1485,"y":1050},"upperLeft":{"x":0,"y":0}},"stencilset":{"url":"../stencilsets/bpmn2.0/bpmn2.0.json","namespace":"http://b3mn.org/stencilset/bpmn2.0#"},"ssextensions":[]}',
            'model2d2v': '{"resourceId":"canvas1","properties":{"name":"","documentation":"","process_id":"process","process_author":"","process_executable":"Yes","process_version":"","process_namespace":"http://www.activiti.org/processdef","executionlisteners":"","eventlisteners":"","dataproperties":""},"stencil":{"id":"BPMNDiagram"},"childShapes":[{"resourceId":"oryx_34DC689D-37A4-4C3C-AE17-A5DABC4B4127","properties":{"overrideid":"","name":"","documentation":"","formproperties":"","initiator":"","formkeydefinition":"","executionlisteners":""},"stencil":{"id":"StartNoneEvent"},"childShapes":[],"outgoing":[{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E"},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E"}],"bounds":{"lowerRight":{"x":227.5,"y":45},"upperLeft":{"x":197.5,"y":15}},"dockers":[]},{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}],"bounds":{"lowerRight":{"x":203.4134980571711,"y":116.38909963381802},"upperLeft":{"x":147.3482206928289,"y":42.04840036618198}},"dockers":[{"x":15,"y":15},{"x":92,"y":33.5}],"target":{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}],"bounds":{"lowerRight":{"x":283.07059042913755,"y":116.41296787241336},"upperLeft":{"x":222.32003457086242,"y":42.02453212758664}},"dockers":[{"x":15,"y":15},{"x":85.50000000000001,"y":33}],"target":{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}},{"resourceId":"oryx_A2C1089D-0E33-4552-B3DE-1A49072E35F7","properties":{"overrideid":"","name":"$cluster1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55","properties":{"overrideid":"","name":"$az1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_9742BA28-E1A5-4B01-8357-162C4F54A741","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61.5},"upperLeft":{"x":105,"y":21.5}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB"}],"bounds":{"lowerRight":{"x":199,"y":101.5},"upperLeft":{"x":15,"y":34.5}},"dockers":[]},{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245","properties":{"overrideid":"","name":"$az2","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_D34C6ADF-58F3-4012-856F-A3694C05D586","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":61,"y":61},"upperLeft":{"x":21,"y":21}},"dockers":[]},{"resourceId":"oryx_A991DA22-BC01-4E6B-BFE4-26E07A2C9DC0","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61},"upperLeft":{"x":105,"y":21}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2"}],"bounds":{"lowerRight":{"x":381,"y":101},"upperLeft":{"x":210,"y":35}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":410,"y":195},"upperLeft":{"x":15,"y":82}},"dockers":[]},{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"ParallelGateway"},"childShapes":[],"outgoing":[{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D"},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248"}],"bounds":{"lowerRight":{"x":232.5,"y":254.25},"upperLeft":{"x":192.5,"y":214.25}},"dockers":[]},{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB","properties":{"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":201.86963375494798,"y":224.353775070214},"upperLeft":{"x":158.08349124505202,"y":183.591537429786}},"dockers":[{"x":92,"y":33.5},{"x":20,"y":20}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":272.42105075510585,"y":224.82443378136125},"upperLeft":{"x":224.41879299489415,"y":183.09939434363875}},"dockers":[{"x":85.50000000000001,"y":33},{"x":20.5,"y":20.5}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}],"bounds":{"lowerRight":{"x":199.50404818266824,"y":270.52628414088076},"upperLeft":{"x":151.84751431733176,"y":242.64559085911927}},"dockers":[{"x":20.5,"y":20.5},{"x":14,"y":14}],"target":{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}},{"resourceId":"oryx_7B06C092-8F54-4A09-8E47-0953BDB0B47E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":134,"y":48.5},"upperLeft":{"x":106,"y":20.5}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":184.5,"y":313.25},"upperLeft":{"x":19.5,"y":243.25}},"dockers":[]},{"resourceId":"oryx_CACD8AB1-7EBD-4848-91E0-9110D676458E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_8FA76418-B008-4272-A62D-D338E7BEE1B5","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":54,"y":48.75},"upperLeft":{"x":26,"y":20.75}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":421.5,"y":315.75},"upperLeft":{"x":256.5,"y":245.75}},"dockers":[]},{"resourceId":"oryx_B58A2F27-0751-4133-966B-5EF145E199DE","properties":{"overrideid":"","name":"$az3","documentation":"","text":"az01"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":132.5,"y":283.25},"upperLeft":{"x":32.5,"y":233.25}},"dockers":[]},{"resourceId":"oryx_20D0A43E-AE44-43CD-A19A-74132BFB7BAF","properties":{"overrideid":"","name":"$az4","documentation":"","text":"az11"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":389,"y":283.25},"upperLeft":{"x":289,"y":233.25}},"dockers":[]},{"resourceId":"oryx_EF156864-C6CC-4D46-AF64-07183D51DD80","properties":{"overrideid":"","name":"FIP: $fip_shenzhen","documentation":"","text":"FIP:205."},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":350.5,"y":45.25},"upperLeft":{"x":205.5,"y":2.25}},"dockers":[]},{"resourceId":"oryx_E6E487F8-72E8-42F1-B00F-4563DF713885","properties":{"overrideid":"","name":"$ip_shenzhen","documentation":"","text":"10.0.0.27"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":325.5,"y":65},"upperLeft":{"x":225.5,"y":15}},"dockers":[]},{"resourceId":"oryx_D62D21F4-DD55-44FA-B431-2CDE215174D8","properties":{"overrideid":"","name":"VIP: $vip","documentation":"","text":""},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":325.5,"y":259.25},"upperLeft":{"x":225.5,"y":209.25}},"dockers":[]},{"resourceId":"oryx_7A48A4BD-ED42-4010-9F3A-B132A6B3ED41","properties":{"overrideid":"","name":"$vm_az01","documentation":"","text":"10.0.0.14"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":192,"y":332},"upperLeft":{"x":92,"y":285}},"dockers":[]},{"resourceId":"oryx_7263AA74-C391-42B7-9FC2-2DE7C38B10B3","properties":{"overrideid":"","name":"$vm_az11","documentation":"","text":"10.0.0.15"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":366.5,"y":335},"upperLeft":{"x":266.5,"y":285}},"dockers":[]},{"resourceId":"oryx_49BBB1A0-99AE-40D5-9589-30EC06269A3A","properties":{"overrideid":"","name":"$shenzhen1","documentation":"","text":"10.0.0.28"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":130,"y":202.625},"upperLeft":{"x":30,"y":152.625}},"dockers":[]},{"resourceId":"oryx_547375F0-4946-44F3-A2BB-474A93EFE0F3","properties":{"overrideid":"","name":"$shenzhen2","documentation":"","text":"10.0.0.29"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":218.5,"y":203.25},"upperLeft":{"x":118.5,"y":153.25}},"dockers":[]},{"resourceId":"oryx_8110E8CC-040B-4691-AE3E-8F64BEBF384C","properties":{"overrideid":"","name":"$shenzhen3","documentation":"","text":"10.0.0.30"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":319.25,"y":202.625},"upperLeft":{"x":219.25,"y":152.625}},"dockers":[]},{"resourceId":"oryx_6C3CA1A0-F2CD-497A-AB25-DEE4B27F5C70","properties":{"overrideid":"","name":"$shenzhen4","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":413.75,"y":202.625},"upperLeft":{"x":313.75,"y":152.625}},"dockers":[]},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"Association"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":287,"y":275},"upperLeft":{"x":226.01908704847276,"y":241.8313277527166}},"dockers":[{"x":20.5,"y":20.5},{"x":287,"y":275}]},{"resourceId":"oryx_DD6F5A9E-AD94-47C3-8F21-4ACF6EDCF3DD","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":97.5,"y":177.375},"upperLeft":{"x":57.5,"y":137.375}},"dockers":[]},{"resourceId":"oryx_4D312215-BD24-4BC7-BC67-BACBFE93D358","properties":{"overrideid":"","name":"...","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":363.75,"y":172.625},"upperLeft":{"x":263.75,"y":122.625}},"dockers":[]},{"resourceId":"oryx_2A23B616-0D07-4D4F-9447-0895EA8AD5A8","properties":{"overrideid":"","name":"...","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":173.75,"y":182.625},"upperLeft":{"x":61.75,"y":116.625}},"dockers":[]}],"bounds":{"lowerRight":{"x":1485,"y":1050},"upperLeft":{"x":0,"y":0}},"stencilset":{"url":"../stencilsets/bpmn2.0/bpmn2.0.json","namespace":"http://b3mn.org/stencilset/bpmn2.0#"},"ssextensions":[]}',
            'model1v1v': '{"resourceId":"canvas1","properties":{"name":"","documentation":"","process_id":"process","process_author":"","process_executable":"Yes","process_version":"","process_namespace":"http://www.activiti.org/processdef","executionlisteners":"","eventlisteners":"","dataproperties":""},"stencil":{"id":"BPMNDiagram"},"childShapes":[{"resourceId":"oryx_34DC689D-37A4-4C3C-AE17-A5DABC4B4127","properties":{"overrideid":"","name":"","documentation":"","formproperties":"","initiator":"","formkeydefinition":"","executionlisteners":""},"stencil":{"id":"StartNoneEvent"},"childShapes":[],"outgoing":[{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E"},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E"}],"bounds":{"lowerRight":{"x":227.5,"y":45},"upperLeft":{"x":197.5,"y":15}},"dockers":[]},{"resourceId":"oryx_B9C0E12B-FC44-4FE2-946F-1E493F27CD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}],"bounds":{"lowerRight":{"x":203.4134980571711,"y":116.38909963381802},"upperLeft":{"x":147.3482206928289,"y":42.04840036618198}},"dockers":[{"x":15,"y":15},{"x":92,"y":33.5}],"target":{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55"}},{"resourceId":"oryx_1E93D0EC-E2ED-4A53-9AA7-FF27F5BABD8E","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}],"bounds":{"lowerRight":{"x":283.07059042913755,"y":116.41296787241336},"upperLeft":{"x":222.32003457086242,"y":42.02453212758664}},"dockers":[{"x":15,"y":15},{"x":85.50000000000001,"y":33}],"target":{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245"}},{"resourceId":"oryx_A2C1089D-0E33-4552-B3DE-1A49072E35F7","properties":{"overrideid":"","name":"$cluster1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_1C3BD699-AE56-4D1F-92D9-F735AFA9BE55","properties":{"overrideid":"","name":"$az1","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_9742BA28-E1A5-4B01-8357-162C4F54A741","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61.5},"upperLeft":{"x":105,"y":21.5}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB"}],"bounds":{"lowerRight":{"x":199,"y":101.5},"upperLeft":{"x":15,"y":34.5}},"dockers":[]},{"resourceId":"oryx_9503FB34-DCB0-48BF-ABB5-597043B13245","properties":{"overrideid":"","name":"$az2","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":"","looptype":"None","dataproperties":""},"stencil":{"id":"SubProcess"},"childShapes":[{"resourceId":"oryx_D34C6ADF-58F3-4012-856F-A3694C05D586","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":61,"y":61},"upperLeft":{"x":21,"y":21}},"dockers":[]},{"resourceId":"oryx_A991DA22-BC01-4E6B-BFE4-26E07A2C9DC0","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":145,"y":61},"upperLeft":{"x":105,"y":21}},"dockers":[]}],"outgoing":[{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2"}],"bounds":{"lowerRight":{"x":381,"y":101},"upperLeft":{"x":210,"y":35}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":410,"y":195},"upperLeft":{"x":15,"y":82}},"dockers":[]},{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"ParallelGateway"},"childShapes":[],"outgoing":[{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D"},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248"}],"bounds":{"lowerRight":{"x":232.5,"y":254.25},"upperLeft":{"x":192.5,"y":214.25}},"dockers":[]},{"resourceId":"oryx_8F4C4BA3-6420-4BF0-B1A2-B2C5850E2EAB","properties":{"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":201.86963375494798,"y":224.353775070214},"upperLeft":{"x":158.08349124505202,"y":183.591537429786}},"dockers":[{"x":92,"y":33.5},{"x":20,"y":20}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_FFA13E89-D8EA-42DD-A731-B2B15091F3F2","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}],"bounds":{"lowerRight":{"x":272.42105075510585,"y":224.82443378136125},"upperLeft":{"x":224.41879299489415,"y":183.09939434363875}},"dockers":[{"x":85.50000000000001,"y":33},{"x":20.5,"y":20.5}],"target":{"resourceId":"oryx_CB00B44C-4980-45A8-976F-96DCCFCF9E6D"}},{"resourceId":"oryx_AA40CC8B-FA9A-4BA2-A253-CEA64F54982D","properties":{"showdiamondmarker":false,"overrideid":"","name":"","documentation":"","conditionsequenceflow":"","defaultflow":"None","conditionalflow":"None","executionlisteners":""},"stencil":{"id":"SequenceFlow"},"childShapes":[],"outgoing":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}],"bounds":{"lowerRight":{"x":199.50404818266824,"y":270.52628414088076},"upperLeft":{"x":151.84751431733176,"y":242.64559085911927}},"dockers":[{"x":20.5,"y":20.5},{"x":14,"y":14}],"target":{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799"}},{"resourceId":"oryx_7B06C092-8F54-4A09-8E47-0953BDB0B47E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_ABD251AD-6385-4D04-9CA0-4EE2CA6F9799","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":134,"y":48.5},"upperLeft":{"x":106,"y":20.5}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":184.5,"y":313.25},"upperLeft":{"x":19.5,"y":243.25}},"dockers":[]},{"resourceId":"oryx_CACD8AB1-7EBD-4848-91E0-9110D676458E","properties":{"overrideid":"","name":"","documentation":"","asynchronousdefinition":"No","exclusivedefinition":"Yes","executionlisteners":""},"stencil":{"id":"EventSubProcess"},"childShapes":[{"resourceId":"oryx_8FA76418-B008-4272-A62D-D338E7BEE1B5","properties":{"overrideid":"","name":"","documentation":"","executionlisteners":""},"stencil":{"id":"EndNoneEvent"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":54,"y":48.75},"upperLeft":{"x":26,"y":20.75}},"dockers":[]}],"outgoing":[],"bounds":{"lowerRight":{"x":421.5,"y":315.75},"upperLeft":{"x":256.5,"y":245.75}},"dockers":[]},{"resourceId":"oryx_B58A2F27-0751-4133-966B-5EF145E199DE","properties":{"overrideid":"","name":"$az3","documentation":"","text":"az01"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":132.5,"y":283.25},"upperLeft":{"x":32.5,"y":233.25}},"dockers":[]},{"resourceId":"oryx_20D0A43E-AE44-43CD-A19A-74132BFB7BAF","properties":{"overrideid":"","name":"$az4","documentation":"","text":"az11"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":389,"y":283.25},"upperLeft":{"x":289,"y":233.25}},"dockers":[]},{"resourceId":"oryx_EF156864-C6CC-4D46-AF64-07183D51DD80","properties":{"overrideid":"","name":"FIP: $fip_shenzhen","documentation":"","text":"FIP:205."},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":350.5,"y":45.25},"upperLeft":{"x":205.5,"y":2.25}},"dockers":[]},{"resourceId":"oryx_E6E487F8-72E8-42F1-B00F-4563DF713885","properties":{"overrideid":"","name":"$ip_shenzhen","documentation":"","text":"10.0.0.27"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":325.5,"y":65},"upperLeft":{"x":225.5,"y":15}},"dockers":[]},{"resourceId":"oryx_D62D21F4-DD55-44FA-B431-2CDE215174D8","properties":{"overrideid":"","name":"VIP: $vip","documentation":"","text":""},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":325.5,"y":259.25},"upperLeft":{"x":225.5,"y":209.25}},"dockers":[]},{"resourceId":"oryx_7A48A4BD-ED42-4010-9F3A-B132A6B3ED41","properties":{"overrideid":"","name":"$vm_az01","documentation":"","text":"10.0.0.14"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":192,"y":332},"upperLeft":{"x":92,"y":285}},"dockers":[]},{"resourceId":"oryx_7263AA74-C391-42B7-9FC2-2DE7C38B10B3","properties":{"overrideid":"","name":"$vm_az11","documentation":"","text":"10.0.0.15"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":366.5,"y":335},"upperLeft":{"x":266.5,"y":285}},"dockers":[]},{"resourceId":"oryx_49BBB1A0-99AE-40D5-9589-30EC06269A3A","properties":{"overrideid":"","name":"$shenzhen1","documentation":"","text":"10.0.0.28"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":130,"y":202.625},"upperLeft":{"x":30,"y":152.625}},"dockers":[]},{"resourceId":"oryx_547375F0-4946-44F3-A2BB-474A93EFE0F3","properties":{"overrideid":"","name":"$shenzhen2","documentation":"","text":"10.0.0.29"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":218.5,"y":203.25},"upperLeft":{"x":118.5,"y":153.25}},"dockers":[]},{"resourceId":"oryx_8110E8CC-040B-4691-AE3E-8F64BEBF384C","properties":{"overrideid":"","name":"$shenzhen3","documentation":"","text":"10.0.0.30"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":319.25,"y":202.625},"upperLeft":{"x":219.25,"y":152.625}},"dockers":[]},{"resourceId":"oryx_6C3CA1A0-F2CD-497A-AB25-DEE4B27F5C70","properties":{"overrideid":"","name":"$shenzhen4","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":413.75,"y":202.625},"upperLeft":{"x":313.75,"y":152.625}},"dockers":[]},{"resourceId":"oryx_553C58F1-CF81-49B8-BCE2-C2B3BD06D248","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"Association"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":287,"y":275},"upperLeft":{"x":226.01908704847276,"y":241.8313277527166}},"dockers":[{"x":20.5,"y":20.5},{"x":287,"y":275}]},{"resourceId":"oryx_DD6F5A9E-AD94-47C3-8F21-4ACF6EDCF3DD","properties":{"overrideid":"","name":"","documentation":""},"stencil":{"id":"EventGateway"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":97.5,"y":177.375},"upperLeft":{"x":57.5,"y":137.375}},"dockers":[]},{"resourceId":"oryx_4D312215-BD24-4BC7-BC67-BACBFE93D358","properties":{"overrideid":"","name":"...","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":363.75,"y":172.625},"upperLeft":{"x":263.75,"y":122.625}},"dockers":[]},{"resourceId":"oryx_2A23B616-0D07-4D4F-9447-0895EA8AD5A8","properties":{"overrideid":"","name":"...","documentation":"","text":"10.0.0.31"},"stencil":{"id":"Text"},"childShapes":[],"outgoing":[],"bounds":{"lowerRight":{"x":173.75,"y":182.625},"upperLeft":{"x":61.75,"y":116.625}},"dockers":[]}],"bounds":{"lowerRight":{"x":1485,"y":1050},"upperLeft":{"x":0,"y":0}},"stencilset":{"url":"../stencilsets/bpmn2.0/bpmn2.0.json","namespace":"http://b3mn.org/stencilset/bpmn2.0#"},"ssextensions":[]}',
        }
        s = Template(models.get(self.cur_model))
        _logger.info('backend info for {2} is {0}:{1}'.format(self.vm_az, self.vm_ip, self.cur_model))
        return s.substitute(cluster1=self.global_cluster[0], fip_shenzhen=self.fip_shenzhen, ip_shenzhen=self.ip_shenzhen,
                            shenzhen1=self.dockers[0]['docker'][0], shenzhen2=self.dockers[0]['docker'][1],
                            shenzhen3=self.dockers[1]['docker'][0], shenzhen4=self.dockers[1]['docker'][1],
                            vip=self.vip, vm_az01=self.vm_ip[0], vm_az11=self.vm_ip[1], vm_az02=self.vm_ip[2],
                            az1=self.dockers[0]['az'], az2=self.dockers[1]['az'], az3=self.vm_az[0],
                            az4=self.vm_az[1], az5=self.vm_az[2])

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


def getCpu(masternode_ip, mininodes_ip):
    loads = []
    try:
        for ip in mininodes_ip:
            r = os.popen('curl --connect-timeout 20 %s:8080/api/v1/proxy/nodes/%s:4194/api/v1.0/containers/ 2>/dev/null' % (masternode_ip, ip)).read()
            cpu = json.loads(r)
            t = cpu['stats'][0]['timestamp']
            mch = json.loads(os.popen('curl --connect-timeout 20 %s:8080/api/v1/proxy/nodes/%s:4194/api/v1.0/machine 2>/dev/null' % (masternode_ip, ip)).read())
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
            #print cpuUsage
            loads.append(total / (stl-1))
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
    global_cluster = []  # {cluter: target}

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

        for service in services:
            if service.get("masterNode", None) is not None:
                nodeCount = service["nodeCount"]
                az = service["availabilityZones"][0]
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
                masternode_ip = service["masterNode"]["instance"]["ipAddresses"][1]
                mininodes = service["minionNodes"]
                mininodes_ip = []
                for mininode in mininodes:
                    mininodes_ip.append(mininode["instance"]["ipAddresses"][0])
                load = getCpu(masternode_ip, mininodes_ip)
                frontend.append({"nodeCount": nodeCount,
                                 "load": load,
                                 "az": az.split(".")[0],
                                 "region": az.split(".")[1],
                                 "scale_service": scale_service,
                                 "name": service["name"],
                                 "ip": masternode_ip})
                cluster.append(service["name"])
                #tasks.append(task_id)
            for node in service.get("instance_uuids", []):
                az = node["az"]
                instance_uuid = node["id"]
                name = node["id"]
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
                if self.global_backend.get(instance_uuid) is not None:
                    if status == "active":
                        if self.global_backend.get(instance_uuid)["status"] == "standby":
                            status = "standby"
                backend.append({"inst": name,
                                "region": az.split(".")[1],
                                "az": az.split(".")[0],
                                "status": status,
                                "instance_id": instance_uuid})
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
        
        if len(backend) == 2:
            if backend[0]["status"] == "active" and backend[1]["status"] == "active":
                backend[1]["status"] = "standby" 
        for item in backend:
            self.global_backend[item["instance_id"]] = item
           
        self.global_cluster = cluster
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
        env = client.environments.get(env_id)
        services = env.services
        for service in services:
            if service["name"] == service_name:
                action_id = "%s_scaleRcUp" % service["?"]["id"]
                task_id = ""
                task_tries = 40
                while task_tries > 0:
                    try:
                        task_id = client.actions.call(env_id, action_id, {"rcName": service_name})
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
                            return "{0}".format(result["result"])
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
        env = client.environments.get(env_id)
        services = env.services
        for service in services:
            if service["name"] == service_name:
                action_id = "%s_scaleRcDown" % service["?"]["id"]
                task_id = ""
                task_tries = 40
                while task_tries > 0:
                    try:
                        task_id = client.actions.call(env_id, action_id, {"rcName": service_name})
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
                            return "{0}".format(result["result"])
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
        for id, item in self.global_backend.items():
            if id == instance_id:
                item["status"] == 'powerinf-off'
            else:
                if item["status"] == "standby":
                    item["status"] == "active"
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
        self.global_backend[instance_id]["status"] == "powering-on"
        return "starting"

    @http.route('/api/turn_over', type='http', auth='none')
    def turn_over(self, **kwargs):
        env_id = kwargs["env_id"]
        if len(self.global_backend) < 2:
            return json.dumps({"backend": self.global_backend.values()})
        backend_0 = self.global_backend.values()[0]
        backend_1 = self.global_backend.values()[1]
        if backend_0["status"] == "active":
            if backend_1["status"] == "standby":
                backend_0["status"] = "standby"
                backend_1["status"] = "active"
        elif backend_0["status"] == "standby":
            if backend_1["status"] == "active":
                backend_0["status"] = "active"
                backend_1["status"] = "standby"
        return json.dumps({"backend": self.global_backend[env_id]})

    @http.route('/api/meter_restart', type='http', auth="none")
    def restart(self, s_action=None, **kw):
        if request.httprequest.method == 'POST':
            users = kw.get('users')
            freq = kw.get('freq')
            address = kw.get('address')
            cluster = kw.get('cluster')
            _logger.debug('restart:{0}, {1}, {2}'.format(users, freq, address))
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
            tree.write(f)
            os.system("ps -ef|grep jmeter | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            os.system('jmeter -n -t %s &' % f)
            os.system("ps -ef|grep sync_meter_result | awk '$8!=\"grep\"{system(\"kill -9 \" $2)}'")
            command = 'python %s/%s' % (currentPath, 'sync_meter_result.py')
            for c in self.global_cluster:
                command = "%s %s" % (command, c)
            os.system("%s &" % command)
            return '{"ret": "success"}'

    @http.route('/api/sync_meter', type='http', auth="none")
    def meter(self, s_action=None, **kw):
        currentPath = os.path.dirname(os.path.realpath(__file__))
        meter_result_file = "%s/meter_result_new" % currentPath
        with open(meter_result_file, "r") as f:
            sync_result = json.load(f)
        self.global_meter_result["stats"] = sync_result
        return json.dumps(self.global_meter_result)

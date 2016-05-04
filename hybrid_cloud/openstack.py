import logging

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

import muranoclient.client as murano

from keystoneclient.v2_0 import client as client_v2
from keystoneclient.v3 import client as client_v3
from keystoneclient import exceptions

from six.moves.urllib import parse as urlparse

import hashlib
from datetime import datetime, timedelta, tzinfo

from . import settings

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


@memoize_by_keyword_arg(_PROJECT_CACHE, ('token', ))
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


class Openstack(http.Controller):
    @http.route('/openstack', type='http', auth="none")
    def web_client(self, s_action=None, **kw):
        if not hasattr(request, 'user'):
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
        return 'Environment[0] is {0}'.format(client.environments.list()[0].name)

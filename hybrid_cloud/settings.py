OS_USERNAME='cloud_admin'
OS_PASSWORD='FusionSphere123'
OS_TENANT_NAME='admin'

OPENSTACK_KEYSTONE_DEFAULT_ROLE = "admin"
OPENSTACK_DEFAULT_REGION = "cloud.hybrid"
OPENSTACK_HOST = "identity.%s.huawei.com" % OPENSTACK_DEFAULT_REGION
OPENSTACK_KEYSTONE_URL = "https://%s/identity/v2.0" % OPENSTACK_HOST

OPENSTACK_SSL_NO_VERIFY = True
USE_TZ = True

DEBUG = False
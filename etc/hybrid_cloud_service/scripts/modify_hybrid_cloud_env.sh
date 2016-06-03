#!/usr/bin/env bash
HYBRID_CLOUD_ENV_FILE=/home/hybrid_cloud/conf/environment.conf

vpn_eip=${1}
cascading_eip=${2}

cat > ${HYBRID_CLOUD_ENV_FILE} <<CONFIG
{
    "env": "/root/adminrc",
    "cascading_api_ip": "172.28.128.50",
    "cascading_domain": "cloud.hybrid.huawei.com",
    "local_vpn_ip": "172.28.128.254",
    "local_vpn_public_gw": "${vpn_eip}",
    "cascading_eip": "${cascading_eip}",
    "local_api_subnet": "172.28.128.0/24",
    "local_vpn_api_ip": "172.28.128.254",
    "local_tunnel_subnet": "172.28.48.0/20",
    "local_vpn_tunnel_ip": "172.28.48.254",
    "existed_cascaded": []
}
CONFIG

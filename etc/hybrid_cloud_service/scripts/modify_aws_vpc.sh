#!/usr/bin/env bash
HYBRID_CLOUD_ENV_FILE=/home/hybrid_cloud/conf/aws_vpc.conf

region=${1}
az=${2}
access_key=${3}
secret_key=${4}
tunnel_subnet_id=${5}
base_subnet_id=${6}

cat > ${HYBRID_CLOUD_ENV_FILE} <<CONFIG
{
    "region":"${region}",
    "az":"${az}",
    "access_key":"${access_key}",
    "secret_key":"${secret_key}",
    "tunnel_subnet_id":"${tunnel_subnet_id}",
    "base_subnet_id":"${base_subnet_id}"
}
CONFIG



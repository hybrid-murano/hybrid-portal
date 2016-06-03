#!/usr/bin/env bash
LOCAL_CONFIG=/etc/neutron/others/cfg_template/neutron-l3-agent.json

AWS_REGION=${1}
AK=${2}
SK=${3}
INTERFACE_ID=${4}

cat > ${LOCAL_CONFIG} <<CONFIG
{
    "l3_agent.ini": {
        "DEFAULT": {
            "external_network_bridge": "",
            "router_delete_namespaces" : "True"
        },
        "provider_opts": {
            "provider_name": "aws",
            "region": "${AWS_REGION}",
            "access_key_id": "${AK}",
            "secret_key": "${SK}",
            "subnet_api_cidr": "172.28.128.0/24",
            "network_interface_id": "${INTERFACE_ID}",
            "gateway_ip": "172.28.128.50",
            "exclued_private_ips": "172.28.128.50,172.28.128.51,172.28.128.254"
        }
    },
    "neutron_l3.conf": {
        "DEFAULT": {
            "debug": "True",
            "verbose" : "True",
            "lock_path": "/tmp/tmp_neutron",
            "log_format": "neutron-l3-agent %(levelname)s [pid:%(process)d] [%(threadName)s] [%(filename)s:%(lineno)d %(funcName)s] %(message)s",
            "use_syslog": "True",
            "syslog_log_facility": "local1",
            "rabbit_password": "N8296FGj0gDK1OA8djBQ50u/7CZvJ+RfE2qNhiGICE8=",
            "router_reschedule": "True",
            "rabbit_userid": "rabbit",
            "kombu_heartbeat" : "60"
        },
        "agent": {
            "report_interval" : "30"
        }
    }
}
CONFIG

sleep 2s
. /root/adminrc
cps host-template-instance-operate --action stop --service neutron neutron-l3-agent
sleep 2s
cps host-template-instance-operate --action start --service neutron neutron-l3-agent

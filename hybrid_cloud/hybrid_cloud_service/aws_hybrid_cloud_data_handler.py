import threading
import os
import json

import logging
logger = logging.getLogger(__name__)

_aws_hybrid_cloud_data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                           "aws_hybrid_cloud.data")
# _aws_hybrid_cloud_data_file = os.path.join("D:\PycharmProjects\HybridCloudaaS\etc\hybrid_cloud_service\data",
#                                             "aws_hybrid_cloud.data")
_aws_hybrid_cloud_data_file_lock = threading.Lock()


def _read_aws_hybrid_cloud_info():
    aws_hybrid_cloud = {}
    if not os.path.exists(_aws_hybrid_cloud_data_file):
        logger.error("read %s : No such file." % _aws_hybrid_cloud_data_file)
    else:
        with open(_aws_hybrid_cloud_data_file, 'r+') as fd:
            try:
                aws_hybrid_cloud = json.loads(fd.read())
            except:
                pass
    return aws_hybrid_cloud


def _write_aws_hybrid_cloud_info(aws_hybrid_clouds):
    with open(_aws_hybrid_cloud_data_file, 'w+') as fd:
        fd.write(json.dumps(aws_hybrid_clouds, indent=4))


def get_aws_hybrid_cloud(cloud_id):
    _aws_hybrid_cloud_data_file_lock.acquire()
    try:
        cloud_dict = _read_aws_hybrid_cloud_info()
    except Exception as e:
        cloud_dict = {}
        logger.error("get aws access cloud info error, cloud_id: %s, error: %s"
                     % (cloud_id, e.message))
    finally:
        _aws_hybrid_cloud_data_file_lock.release()

    if cloud_id in cloud_dict.keys():
        return cloud_dict[cloud_id]
    else:
        return None


def delete_aws_hybrid_cloud(cloud_id):
    _aws_hybrid_cloud_data_file_lock.acquire()
    try:
        cloud_dict = _read_aws_hybrid_cloud_info()
        if cloud_id in cloud_dict.keys():
            cloud_dict.pop(cloud_id)
        _write_aws_hybrid_cloud_info(cloud_dict)
    except Exception as e:
        logger.error("delete aws access cloud error, cloud_id: %s, error: %s"
                     % (cloud_id, e.message))
    finally:
        _aws_hybrid_cloud_data_file_lock.release()


def _get_unit_info(cloud_id, unit_key):
    cloud_info = get_aws_hybrid_cloud(cloud_id)
    if not cloud_info:
        return None

    if unit_key in cloud_info.keys():
        return cloud_info[unit_key]
    else:
        return None


def _write_unit_info(cloud_id, unit_key, unit_value):
    _aws_hybrid_cloud_data_file_lock.acquire()
    try:
        cloud_dict = _read_aws_hybrid_cloud_info()
        if cloud_id in cloud_dict.keys():
            cloud_dict[cloud_id][unit_key] = unit_value
        else:
            cloud_dict[cloud_id] = {unit_key: unit_value}
        _write_aws_hybrid_cloud_info(cloud_dict)
    except Exception as e:
        logger.error("write access cloud unit info error, "
                     "cloud_id: %s, unit_key: %s, unit_value: %s, error: %s"
                     % (cloud_id, unit_key, unit_value, e.message))
    finally:
        _aws_hybrid_cloud_data_file_lock.release()


def get_vpc(cloud_id):
    return _get_unit_info(cloud_id, "vpc")


def get_cascading(cloud_id):
    return _get_unit_info(cloud_id, "cascading")


def get_vpn(cloud_id):
    return _get_unit_info(cloud_id, "vpn")


def get_horizon(cloud_id):
    return _get_unit_info(cloud_id, "horizon")


def get_free_elastic_addresses(cloud_id):
    return _get_unit_info(cloud_id, "free_eip")


def write_vpc(cloud_id, vpc_id, vpc_cidr,
              debug_subnet_cidr, debug_subnet_id,
              base_subnet_cidr, base_subnet_id,
              api_subnet_id_cidr, api_subnet_id,
              tunnel_subnet_cidr, tunnel_subnet_id,
              igw_id, rtb_id):
    vpn_info = {"vpc_id": vpc_id,
                "vpc_cidr": vpc_cidr,
                "debug_subnet_cidr": debug_subnet_cidr,
                "debug_subnet_id": debug_subnet_id,
                "base_subnet_cidr": base_subnet_cidr,
                "base_subnet_id": base_subnet_id,
                "api_subnet_cidr": api_subnet_id_cidr,
                "api_subnet_id": api_subnet_id,
                "tunnel_subnet_cidr": tunnel_subnet_cidr,
                "tunnel_subnet_id": tunnel_subnet_id,
                "igw_id": igw_id,
                "rtb_id": rtb_id}
    _write_unit_info(cloud_id, "vpc", vpn_info)


def write_cascading(cloud_id,
                    cascading_vm_id,
                    cascading_eip_public_ip, cascading_eip_allocation_id,
                    cascading_debug_ip, cascading_base_ip,
                    cascading_api_ip, cascading_tunnel_ip,
                    cascading_api_interface_id, cascading_base_interface_id):
    cascading_info = {"vm_id": cascading_vm_id,
                      "eip_public_ip": cascading_eip_public_ip,
                      "eip_allocation_id": cascading_eip_allocation_id,
                      "debug_ip": cascading_debug_ip,
                      "base_ip": cascading_base_ip,
                      "api_ip": cascading_api_ip,
                      "tunnel_ip": cascading_tunnel_ip,
                      "api_interface_id": cascading_api_interface_id,
                      "base_interface_id": cascading_base_interface_id}

    _write_unit_info(cloud_id, "cascading", cascading_info)


def write_vpn(cloud_id,
              vpn_vm_id,
              vpn_eip_public_ip, vpn_eip_allocation_id,
              vpn_api_ip, vpn_tunnel_ip,
              vpn_api_interface_id=None, vpn_tunnel_interface_id=None):
    vpn_info = {"vm_id": vpn_vm_id,
                "eip_public_ip": vpn_eip_public_ip,
                "eip_allocation_id": vpn_eip_allocation_id,
                "api_ip": vpn_api_ip,
                "tunnel_ip": vpn_tunnel_ip,
                "api_interface_id": vpn_api_interface_id,
                "tunnel_interface_id": vpn_tunnel_interface_id}

    _write_unit_info(cloud_id, "vpn", vpn_info)


def write_horizon(cloud_id, horizon_vm_id):
    horizon_info = {"vm_id": horizon_vm_id}
    _write_unit_info(cloud_id, "horizon", horizon_info)


def write_ext_net_eips(cloud_id, ext_net_eips):
    _write_unit_info(cloud_id, "ext_net_eips", ext_net_eips)

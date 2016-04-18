import aws_hybrid_cloud_installer
from commonutils import *
from hcaas_exception import *
import logging
logger = logging.getLogger(__name__)

def deploy_aws_hybrid_cloud(region, az, access_key, secret_key):
    # install aws hybrid clous
    vpc_cidr = "172.28.0.0/16"
    debug_cidr = "172.28.124.0/24"
    base_cidr = "172.28.0.0/20"
    api_cidr = "172.28.128.0/24"
    tunnel_cidr = "172.28.48.0/20"

    cloud_id = "@".join([access_key, region, az])
    install_info = aws_hybrid_cloud_installer.install_aws_hybrid_cloud(
            cloud_id, region, az, access_key, secret_key,
            vpc_cidr, debug_cidr, base_cidr, api_cidr, tunnel_cidr)

    if not install_info:
        logger.error("install aws hybrid cloud error.")

    logger.info("install aws hybrid cloud success.")

    cascading_ip = install_info["cascading_eip"]
    host_ready = _check_host(host_ip=cascading_ip,
                             user="root", password="Huawei@CLOUD8!")

    if not host_ready:
        logger.error("aws hybrid cloud status error, check it. host: %s"
                     % install_info["cascading_eip"])

    logger.info("init service...")

    time.sleep(120)

    _config_hybrid_cloud_evn(cascading_eip=install_info["cascading_eip"],
                             vpn_eip=install_info["vpn_eip"])

    _config_aws_vpc_evn(cascading_eip=install_info["cascading_eip"],
                        region=region, az=az,
                        access_key=access_key, secret_key=secret_key,
                        tunnel_subnet_id=install_info["tunnel_subnet_id"],
                        base_subnet_id=install_info["base_subnet_id"])

    _update_l3_agent_conf(host_ip=cascading_ip,
                          user="root", password="Huawei@CLOUD8!",
                          aws_region=region,
                          access_key=access_key, secret_key=secret_key,
                          interface_id=install_info["cascading_api_int_id"])

    result = _create_ext_subnet(host_ip=install_info["cascading_eip"],
                                user="root", passwd="Huawei@CLOUD8!",
                                ext_net_eips=install_info["ext_net_eips"])

    if not result:
        logger.info("can not create ext subnet, try to reboot the host.")
        _reboot_host(host_ip=cascading_ip,
                     user="root", password="Huawei@CLOUD8!")

        time.sleep(60)

        _check_host(host_ip=cascading_ip,
                    user="root", password="Huawei@CLOUD8!")
        logger.info("host is ready...")

        time.sleep(60)

        result = _create_ext_subnet(host_ip=install_info["cascading_eip"],
                                    user="root", passwd="Huawei@CLOUD8!",
                                    ext_net_eips=install_info["ext_net_eips"])

    if not result:
        logger.info("create net work error, check it.")
        return None

    logger.info("create hybrid cloud success.")
    return {"URL": "http://%s" % install_info["vpn_eip"],
            "User": "cloud_admain",
            "Password": "FusionSphere123"}


def undeploy_aws_hybrid_cloud(region, az, access_key, secret_key):
    cloud_id = "@".join([access_key, region, az])
    aws_hybrid_cloud_installer.uninstall_aws_hybrid_cloud(
            cloud_id, region, az, access_key, secret_key)
    return True


def _update_l3_agent_conf(host_ip, user, password,
                          aws_region, access_key, secret_key, interface_id):
    for i in range(3):
        try:
            execute_cmd_without_stdout(
                    host=host_ip, user=user, password=password,
                    cmd="cd %(dir)s; "
                        "sh %(script)s "
                        "%(aws_region)s %(access_key)s %(secret_key)s "
                        "%(interface_id)s"
                        % {"dir": "/home/hybrid_cloud_service/scripts",
                           "script": "update_neutron_l3_agent.sh",
                           "aws_region": aws_region,
                           "access_key": access_key,
                           "secret_key": secret_key,
                           "interface_id": interface_id})
            logger.info("update l3 agent conf success.")
            return True
        except Exception as e:
            logger.error("update l3 agent error, error: %s" % e.message)
            time.sleep(1)

    logger.error("update l3 agent failed.")
    return False


def _create_ext_subnet(host_ip, user, passwd, ext_net_eips):
    if not ext_net_eips:
        return False

    ext_cidr = "%s.0.0.0/8" % ext_net_eips[0].split(".")[0]

    create_subnet_cmd = ". /root/adminrc; " \
                        "neutron subnet-create ext-hybridcloud-net " \
                        "%s --name ext-hybridcloud-subnet" \
                        % ext_cidr

    for eip in ext_net_eips:
        create_subnet_cmd += ' --allocation-pool start=%s,end=%s' \
                             % (eip, eip)

    create_subnet_cmd += ' --disable-dhcp --no-gateway'

    for i in range(3):
        try:
            execute_cmd_without_stdout(host=host_ip, user=user,
                                       password=passwd,
                                       cmd=create_subnet_cmd)
            logger.info("")
            return True
        except Exception as e:
            logger.error("create ext subnet error, ext_net_eips: %s. error: %s"
                         % (ext_net_eips, e.message))
            time.sleep(2)

    return False


def _config_hybrid_cloud_evn(cascading_eip, vpn_eip):

    cmd = 'cd %s; sh modify_hybrid_cloud_env.sh %s %s' \
          % ("/home/hybrid_cloud_service/scripts", vpn_eip, cascading_eip)
    for i in range(3):
        try:
            execute_cmd_without_stdout(
                    host=cascading_eip,
                    user="root",
                    password="Huawei@CLOUD8!",
                    cmd=cmd)
            return True
        except SSHCommandFailure as e:
            logger.error("create external subnet error: %s"
                         % e.format_message())
            time.sleep(1)
    return False


def _config_aws_vpc_evn(cascading_eip, region, az, access_key, secret_key,
                        tunnel_subnet_id, base_subnet_id):
    cmd = 'cd %(dir)s; sh modify_aws_vpc.sh %(region)s ' \
          '%(az)s %(access_key)s %(secret_key)s ' \
          '%(tunnel_subnet_id)s %(base_subnet_id)s' \
          % {"dir": "/home/hybrid_cloud_service/scripts",
             "region": region, "az": az,
             "access_key": access_key, "secret_key": secret_key,
             "tunnel_subnet_id": tunnel_subnet_id,
             "base_subnet_id": base_subnet_id}
    for i in range(3):
        try:
            execute_cmd_without_stdout(
                    host=cascading_eip,
                    user="root",
                    password="Huawei@CLOUD8!",
                    cmd=cmd)
            return True
        except SSHCommandFailure as e:
            logger.error("create external subnet error: %s"
                         % e.format_message())
            time.sleep(1)
    return False


def _check_host(host_ip, user, password):
    for i in range(10):
        try:
            check_host_status(host=host_ip,
                              user=user,
                              password=password)
            logger.info("cascading host is ready..")
            return True
        except CheckHostStatusFailure as e:
            logger.error("check host error, host_ip: %s. error: %s"
                         % (host_ip, e.message))
            time.sleep(1)

    logger.error("check host failed, host_ip: %s." % host_ip)
    return False


def _reboot_host(host_ip, user, password):
    for i in range(3):
        try:
            execute_cmd_without_stdout(
                    host=host_ip, user=user, password=password,
                    cmd="reboot")
            return True
        except SSHCommandFailure as e:
            logger.error("reboot host error: %s" % e.format_message())
            time.sleep(1)
    return False


if __name__ == '__main__':
    # deploy_aws_hybrid_cloud("ap-southeast-2", "ap-southeast-2a",
    #                          "AKIAJ3HTTPBMWMJUPN7A",
    #                          "izli+iQdd4dDApVbn25Py5mdHFDRVq87yHVgB6QW")

    undeploy_aws_hybrid_cloud("ap-southeast-2", "ap-southeast-2a",
                              "AKIAJ3HTTPBMWMJUPN7A",
                              "izli+iQdd4dDApVbn25Py5mdHFDRVq87yHVgB6QW")

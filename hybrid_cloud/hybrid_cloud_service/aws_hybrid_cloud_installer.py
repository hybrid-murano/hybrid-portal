import json
import aws_util
from commonutils import *
import aws_hybrid_cloud_data_handler as data_handler
import logging
logger = logging.getLogger(__name__)

_install_conf = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             'hybrid_cloud_install.conf')

# _install_conf = os.path.join("D:\PycharmProjects\HybridCloudaaS\etc\hybrid_cloud_service\conf",
#                              'hybrid_cloud_install.conf')


def _read_install_conf():
    if not os.path.exists(_install_conf):
        logger.error("read %s : No such file." % _install_conf)
        return None
    with open(_install_conf, 'r+') as fd:
        tmp = fd.read()
        return json.loads(tmp)


def _write_install_conf():
    install_conf = {
        "cascading_image": "hybrid-cloud-cascading_v0.4_b",
        "cascading_vm_type": "c3.xlarge",
        "vpn_image": "hybrid-cloud-vpn_v0.2",
        "vpn_vm_type": "t2.micro",
        "horizon_image": "hybrid-cloud-horizon_v0.2",
        "horizon_vm_type": "t2.micro"
    }

    with open(_install_conf, 'w+') as fd:
        fd.write(json.dumps(install_conf, indent=4))
        return install_conf


class AWSHybridCloudInstaller(object):
    def __init__(self, cloud_id, access_key, secret_key, region, az):
        self.cloud_id = cloud_id
        self.region = region
        self.az = az
        self.access_key = access_key
        self.secret_key = secret_key

        self.installer = aws_util.AWSInstaller(access_key, secret_key,
                                               region, az)

        install_conf = _read_install_conf()
        if not install_conf:
            install_conf = _write_install_conf()

        self.cascading_image = install_conf["cascading_image"]
        self.cascading_vm_type = install_conf["cascading_vm_type"]

        self.vpn_image = install_conf["vpn_image"]
        self.vpn_vm_type = install_conf["vpn_vm_type"]

        self.horizon_image = install_conf["horizon_image"]
        self.horizon_vm_type = install_conf["horizon_vm_type"]

        self.vpc_cidr = None
        self.vpc_debug_cidr = None
        self.vpc_base_cidr = None
        self.vpc_api_cidr = None
        self.vpc_tunnel_cidr = None

        self.vpc_id = None
        self.vpc_debug_subnet_id = None
        self.vpc_base_subnet_id = None
        self.vpc_api_subnet_id = None
        self.vpc_tunnel_subnet_id = None
        self.vpc_rtb_id = None
        self.vpc_igw_id = None

        self.cascading_vm = None
        self.cascading_vm_id = None
        self.cascading_debug_ip = None
        self.cascading_base_ip = None
        self.cascading_base_interface_id = None
        self.cascading_api_ip = None
        self.cascading_api_interface_id = None
        self.cascading_tunnel_ip = None
        self.cascading_eip_public_ip = None
        self.cascading_eip_allocation_id = None

        self.vpn_vm = None
        self.vpn_vm_id = None
        self.vpn_api_ip = None
        self.vpn_runnel_ip = None
        self.vpn_eip_public_ip = None
        self.vpn_eip_allocation_id = None
        self.vpn_api_interface_id = None
        self.vpn_tunnel_interface_id = None

        self.horizon_vm = None
        self.horizon_vm_id = None

        self.ext_net_eips = {}

        self._read_aws_hybrid_cloud()

    def _read_aws_hybrid_cloud(self):
        hybrid_cloud = data_handler.get_aws_hybrid_cloud(self.cloud_id)

        if not hybrid_cloud:
            return

        if "vpc" in hybrid_cloud.keys():
            vpc_info = hybrid_cloud["vpc"]
            self.vpc_id = vpc_info["vpc_id"]
            self.vpc_cidr = vpc_info["vpc_cidr"]
            self.vpc_debug_cidr = vpc_info["debug_subnet_cidr"]
            self.vpc_base_cidr = vpc_info["base_subnet_cidr"]
            self.vpc_api_cidr = vpc_info["api_subnet_cidr"]
            self.vpc_tunnel_cidr = vpc_info["tunnel_subnet_cidr"]

            self.vpc_debug_subnet_id = vpc_info["debug_subnet_id"]
            self.vpc_base_subnet_id = vpc_info["base_subnet_id"]
            self.vpc_api_subnet_id = vpc_info["api_subnet_id"]
            self.vpc_tunnel_subnet_id = vpc_info["tunnel_subnet_id"]
            self.vpc_rtb_id = vpc_info["rtb_id"]
            self.vpc_igw_id = vpc_info["igw_id"]

        if "cascading" in hybrid_cloud.keys():
            cascading_info = hybrid_cloud["cascading"]
            self.cascading_vm_id = cascading_info["vm_id"]
            self.cascading_api_ip = cascading_info["api_ip"]
            self.cascading_debug_ip = cascading_info["debug_ip"]
            self.cascading_base_ip = cascading_info["base_ip"]
            self.cascading_tunnel_ip = cascading_info["tunnel_ip"]
            self.cascading_eip_public_ip = cascading_info["eip_public_ip"]
            self.cascading_eip_allocation_id = cascading_info["eip_allocation_id"]
            self.cascading_api_interface_id = cascading_info["api_interface_id"]
            self.cascading_base_interface_id = cascading_info["base_interface_id"]

        if "vpn" in hybrid_cloud.keys():
            vpn_info = hybrid_cloud["vpn"]
            self.vpn_vm_id = vpn_info["vm_id"]
            self.vpn_api_ip = vpn_info["api_ip"]
            self.vpn_runnel_ip = vpn_info["tunnel_ip"]
            self.vpn_eip_public_ip = vpn_info["eip_public_ip"]
            self.vpn_eip_allocation_id = vpn_info["eip_allocation_id"]
            self.vpn_api_interface_id = vpn_info["api_interface_id"]
            self.vpn_tunnel_interface_id = vpn_info["tunnel_interface_id"]

        if "horizon" in hybrid_cloud.keys():
            horizon_info = hybrid_cloud["horizon"]
            self.horizon_vm_id = horizon_info["vm_id"]

        if "ext_net_eips" in hybrid_cloud.keys():
            self.ext_net_eips = hybrid_cloud["ext_net_eips"]

    def _allocation_ip(self):
        if self.vpc_debug_cidr:
            ip_list = self.vpc_debug_cidr.split(".")
            self.cascading_debug_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "12"])

        if self.vpc_base_cidr:
            ip_list = self.vpc_base_cidr.split(".")
            self.cascading_base_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "12"])

        if self.vpc_api_cidr:
            ip_list = self.vpc_api_cidr.split(".")
            self.cascading_api_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "50"])
            self.vpn_api_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "254"])
            self.horizon_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "200"])

        if self.vpc_tunnel_cidr:
            ip_list = self.vpc_tunnel_cidr.split(".")
            self.cascading_tunnel_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "12"])
            self.vpn_tunnel_ip = ".".join(
                    [ip_list[0], ip_list[1], ip_list[2], "254"])

    def create_vpc(self, vpc_cidr_block, debug_cidr_block, base_cidr_block,
                   api_cidr_block, tunnel_cidr_block, visit_cidr="0.0.0.0/0"):
        if self.vpc_id:
            return

        # install vpc
        vpc = self.installer.create_vpc(vpc_cidr_block)
        self.vpc_id = vpc.id
        self.vpc_cidr = vpc_cidr_block

        self.installer.associate_dhcp_options("default", vpc.id)

        # get route table id, every vpc only have one route table.
        l = self.installer.get_all_route_tables(self.vpc_id)
        self.vpc_rtb_id = l[0].id

        # add internet gateway
        self.vpc_igw_id = self.installer.create_internet_gateway()
        self.installer.attach_internet_gateway(self.vpc_igw_id, self.vpc_id)
        self.installer.create_route(self.vpc_rtb_id, "0.0.0.0/0",
                                    gateway_id=self.vpc_igw_id)

        sgs = self.installer.get_all_security_groups(self.vpc_id)
        for sg in sgs:
            sg.authorize(ip_protocol="-1", cidr_ip=visit_cidr)

        # install subnet
        self.vpc_debug_subnet_id = self.installer.create_subnet(
            self.vpc_id, debug_cidr_block)
        self.vpc_debug_cidr = debug_cidr_block
        self.vpc_base_subnet_id = self.installer.create_subnet(
            self.vpc_id, base_cidr_block)
        self.vpc_base_cidr = base_cidr_block
        self.vpc_api_subnet_id = self.installer.create_subnet(
            self.vpc_id, api_cidr_block)
        self.vpc_api_cidr = api_cidr_block
        self.vpc_tunnel_subnet_id = self.installer.create_subnet(
            self.vpc_id, tunnel_cidr_block)
        self.vpc_tunnel_cidr = tunnel_cidr_block

        self._allocation_ip()

        data_handler.write_vpc(
                cloud_id=self.cloud_id, vpc_id=self.vpc_id,
                vpc_cidr=self.vpc_cidr,
                debug_subnet_cidr=self.vpc_debug_cidr,
                debug_subnet_id=self.vpc_debug_subnet_id,
                base_subnet_cidr=self.vpc_base_cidr,
                base_subnet_id=self.vpc_base_subnet_id,
                api_subnet_id_cidr=self.vpc_api_cidr,
                api_subnet_id=self.vpc_api_subnet_id,
                tunnel_subnet_cidr=self.vpc_tunnel_cidr,
                tunnel_subnet_id=self.vpc_tunnel_subnet_id,
                igw_id=self.vpc_igw_id,
                rtb_id=self.vpc_rtb_id)

    def create_cascading(self):
        if self.cascading_vm_id:
            return

        cascading_debug_en = aws_util.AWSInterface(
            self.vpc_debug_subnet_id, self.cascading_debug_ip)
        cascading_base_en = aws_util.AWSInterface(
            self.vpc_base_subnet_id, self.cascading_base_ip)
        cascading_api_en = aws_util.AWSInterface(
            self.vpc_api_subnet_id, self.cascading_api_ip)
        cascading_tunnel_en = aws_util.AWSInterface(
            self.vpc_tunnel_subnet_id, self.cascading_tunnel_ip)

        self.cascading_vm = self.installer.create_vm(
            self.cascading_image, self.cascading_vm_type,
            cascading_debug_en, cascading_base_en,
            cascading_api_en, cascading_tunnel_en)

        self.cascading_vm_id = self.cascading_vm.id

        for interface in self.cascading_vm.interfaces:
            if self.cascading_api_ip == interface.private_ip_address:
                self.cascading_api_interface_id = interface.id

            if self.cascading_base_ip == interface.private_ip_address:
                self.cascading_base_interface_id = interface.id

        cascading_eip = self.installer.allocate_elastic_address()
        self.installer.associate_elastic_address(
                eip=cascading_eip,
                network_interface_id=self.cascading_api_interface_id)

        self.cascading_eip_public_ip = cascading_eip.public_ip
        self.cascading_eip_allocation_id = cascading_eip.allocation_id

        self.installer.assign_private_ip_addresses(
                self.cascading_api_interface_id, ["172.28.128.51"])
        self.installer.assign_private_ip_addresses(
                self.cascading_base_interface_id,
                ["172.28.2.42", "172.28.1.121", "172.28.1.120",
                 "172.28.1.101", "172.28.1.130", "172.28.2.20",
                 "172.28.1.61", "172.28.2.34", "172.28.10.100",
                 "172.28.1.100"])

        data_handler.write_cascading(cloud_id=self.cloud_id,
                                     cascading_vm_id=self.cascading_vm_id,
                                     cascading_eip_public_ip=self.cascading_eip_public_ip,
                                     cascading_eip_allocation_id=self.cascading_eip_allocation_id,
                                     cascading_debug_ip=self.cascading_debug_ip,
                                     cascading_base_ip=self.cascading_base_ip,
                                     cascading_api_ip=self.cascading_api_ip,
                                     cascading_tunnel_ip=self.cascading_tunnel_ip,
                                     cascading_api_interface_id=self.cascading_api_interface_id,
                                     cascading_base_interface_id=self.cascading_base_interface_id)

    def create_vpn(self):
        if self.vpn_vm_id:
            return

        vpn_api_en = aws_util.AWSInterface(
            self.vpc_api_subnet_id, self.vpn_api_ip)
        vpn_tunnel_en = aws_util.AWSInterface(
            self.vpc_tunnel_subnet_id, self.vpn_tunnel_ip)

        self.vpn_vm = self.installer.create_vm(
                self.vpn_image, self.vpn_vm_type,
                vpn_api_en, vpn_tunnel_en)
        self.vpn_vm_id = self.vpn_vm.id

        for interface in self.vpn_vm.interfaces:
            self.installer.disable_network_interface_sdcheck(interface.id)
            if self.vpn_api_ip == interface.private_ip_address:
                self.vpn_api_interface_id = interface.id

            if self.vpn_tunnel_ip == interface.private_ip_address:
                self.vpn_tunnel_interface_id = interface.id

        vpn_eip = self.installer.allocate_elastic_address()
        self.installer.associate_elastic_address(
            eip=vpn_eip, network_interface_id=self.vpn_api_interface_id)
        self.vpn_eip_public_ip = vpn_eip.public_ip
        self.vpn_eip_allocation_id = vpn_eip.allocation_id

        data_handler.write_vpn(cloud_id=self.cloud_id,
                               vpn_vm_id=self.vpn_vm_id,
                               vpn_eip_public_ip=self.vpn_eip_public_ip,
                               vpn_eip_allocation_id=self.vpn_eip_allocation_id,
                               vpn_api_ip=self.vpn_api_ip,
                               vpn_tunnel_ip=self.vpn_tunnel_ip,
                               vpn_api_interface_id=self.vpn_api_interface_id,
                               vpn_tunnel_interface_id=self.vpn_tunnel_interface_id)

    def create_horizon(self):
        if self.horizon_vm_id:
            return

        horizon_en = aws_util.AWSInterface(
                self.vpc_api_subnet_id, self.horizon_ip)
        self.horizon_vm = self.installer.create_vm(
                self.horizon_image, self.horizon_vm_type, horizon_en)
        self.horizon_vm_id = self.horizon_vm.id

        data_handler.write_horizon(cloud_id=self.cloud_id,
                                   horizon_vm_id=self.horizon_vm_id)

    def package_hybrid_cloud_info(self):
        if not self.vpc_id:
            return None

        hybrid_cloud_info = {"cascading_eip": self.cascading_eip_public_ip,
                             "vpn_eip": self.vpn_eip_public_ip,
                             "cascading_api_int_id": self.cascading_api_interface_id,
                             "ext_net_eips": self.ext_net_eips.keys(),
                             "tunnel_subnet_id": self.vpc_tunnel_subnet_id,
                             "base_subnet_id": self.vpc_base_subnet_id}

        return hybrid_cloud_info

    def allocate_elastic_address(self):
        if self.ext_net_eips:
            return

        first_eip = self.installer.allocate_elastic_address()
        if not first_eip:
            logger.error("allocate elastic address error, check the account.")

        self.ext_net_eips[first_eip.public_ip] = first_eip.allocation_id
        fist_8bit = first_eip.public_ip.split('.')[0]

        while True:
            try:
                eip = self.installer.allocate_elastic_address()
                fist_8bit_ip = eip.public_ip.split('.')[0]
                if fist_8bit == fist_8bit_ip:
                    self.ext_net_eips[eip.public_ip] = eip.allocation_id
                else:
                    self.installer.release_elastic_address(eip.public_ip)
            except InstallCascadingFailed:
                break

        data_handler.write_ext_net_eips(
                cloud_id=self.cloud_id, ext_net_eips=self.ext_net_eips)

    def release_elastic_address(self):
        if not self.ext_net_eips:
            return

        for (elastic_ip, allocation_id) in self.ext_net_eips.items():
            try:
                self.installer.release_elastic_address(allocation_id)
            except UninstallCascadingFailed:
                continue
        self.ext_net_eips = {}

    def rollback(self):
        if self.cascading_eip_public_ip is not None:
            self.installer.disassociate_elastic_address(
                self.cascading_eip_public_ip)
            self.installer.release_elastic_address(
                self.cascading_eip_allocation_id)
            self.cascading_eip_public_ip = None

        if self.vpn_eip_public_ip is not None:
            self.installer.disassociate_elastic_address(
                self.vpn_eip_public_ip)
            self.installer.release_elastic_address(
                self.vpn_eip_allocation_id)
            self.vpn_eip_public_ip = None

        if self.cascading_vm_id is not None:
            self.installer.terminate_instance(self.cascading_vm_id)
            self.cascading_vm_id = None

        if self.vpn_vm_id is not None:
            self.installer.terminate_instance(self.vpn_vm_id)
            self.vpn_vm_id = None

        if self.horizon_vm_id is not None:
            self.installer.terminate_instance(self.horizon_vm_id)
            self.horizon_vm_id = None

        if self.vpc_igw_id is not None:
            self.installer.detach_internet_gateway(self.vpc_igw_id, self.vpc_id)
            self.installer.delete_internet_gateway(self.vpc_igw_id)
            self.vpc_igw_id = None

        if self.vpc_debug_subnet_id is not None:
            self.installer.delete_subnet(self.vpc_debug_subnet_id)
            self.vpc_debug_subnet_id = None

        if self.vpc_base_subnet_id is not None:
            self.installer.delete_subnet(self.vpc_base_subnet_id)
            self.vpc_base_subnet_id = None

        if self.vpc_api_subnet_id is not None:
            self.installer.delete_subnet(self.vpc_api_subnet_id)
            self.vpc_api_subnet_id = None

        if self.vpc_tunnel_subnet_id is not None:
            self.installer.delete_subnet(self.vpc_tunnel_subnet_id)
            self.vpc_tunnel_subnet_id = None

        if self.vpc_id is not None:
            self.installer.delete_vpc(self.vpc_id)
            self.vpc_id = None

        self.release_elastic_address()

    def uninstall(self):
        self.rollback()

    def add_security(self, cidr):
        if not self.vpc_id:
            return

        sgs = self.installer.get_all_security_groups(self.vpc_id)
        for sg in sgs:
            sg.authorize(ip_protocol="-1", cidr_ip=cidr)

    def remove_security(self, cidr):
        sgs = self.installer.get_all_security_groups(self.vpc_id)
        for sg in sgs:
            sg.revoke(ip_protocol="-1", cidr_ip=cidr)

    def delete_hybrid_cloud_data(self):
        data_handler.delete_aws_hybrid_cloud(self.cloud_id)


def install_aws_hybrid_cloud(cloud_id,
                             region, az, access_key, secret_key,
                             vpc_cidr="172.28.0.0/16",
                             debug_cidr="172.28.124.0/24",
                             base_cidr="172.28.0.0/20",
                             api_cidr="172.28.128.0/24",
                             tunnel_cidr="172.28.48.0/20"):
    installer = AWSHybridCloudInstaller(cloud_id, access_key, secret_key,
                                        region, az)
    try:
        installer.create_vpc(vpc_cidr, debug_cidr, base_cidr, api_cidr,
                             tunnel_cidr)
        installer.create_cascading()
        installer.create_vpn()
        installer.create_horizon()
        installer.allocate_elastic_address()
        return installer.package_hybrid_cloud_info()
    except Exception as e:
        logger.error("hybrid cloud install failed, start rollback. error: %s"
                     % e.message)
        if installer is not None:
            installer.rollback()
            installer.delete_hybrid_cloud_data()
        return None


def uninstall_aws_hybrid_cloud(cloud_id, region, az, access_key, secret_key):
    installer = AWSHybridCloudInstaller(cloud_id, access_key, secret_key,
                                        region, az)

    installer.uninstall()
    installer.delete_hybrid_cloud_data()


def allocate_elastic_address(cloud_id, region, az, access_key, secret_key):
    installer = AWSHybridCloudInstaller(cloud_id, access_key, secret_key,
                                        region, az)
    installer.allocate_elastic_address()
    return installer.ext_net_eips.keys()


def release_elastic_address(cloud_id, region, az, access_key, secret_key):
    installer = AWSHybridCloudInstaller(cloud_id, access_key, secret_key,
                                        region, az)
    installer.release_elastic_address()


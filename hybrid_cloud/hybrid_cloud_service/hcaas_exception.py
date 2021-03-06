class HybridCloudaaSException(Exception):
    """Base HybridCloudaaS Exception

    To correctly use this class, inherit from it and define
    a 'msg_fmt' property. That msg_fmt will get printf'd
    with the keyword arguments provided to the constructor.

    """
    msg_fmt = "Hybrid_Cloud_aa_S base exception."

    def __init__(self, **kwargs):
        self.kwargs = kwargs

        try:
            message = self.msg_fmt % kwargs
        except KeyError:
            message = self.msg_fmt

        super(HybridCloudaaSException, self).__init__(message)

    def format_message(self):
        return self.args[0]


class InstallCascadingFailed(HybridCloudaaSException):
    msg_fmt = "failed to install cascading openstack, " \
              "current step: %(current_step)s."


class UninstallCascadingFailed(HybridCloudaaSException):
    msg_fmt = "failed to uninstall cascading openstack, " \
              "current step: %(current_step)s."


class SSHCommandFailure(HybridCloudaaSException):
    msg_fmt = "failed to execute ssh command : " \
              "host: %(host)s, command: %(command)s, error: %(error)s"


class CheckHostStatusFailure(HybridCloudaaSException):
    msg_fmt = "check host status failed, host: %(host)s"


class ScpFileToHostFailure(HybridCloudaaSException):
    msg_fmt = "spc file to host failed, host: %(host)s," \
              " file_name: %(file_name)s, local_dir: %(local_dir)s," \
              " remote_dir: %(remote_dir)s, error: %(error)s"


class CreateExtSubnetFailure(HybridCloudaaSException):
    msg_fmt = "create ext net failed, host: %(host)s, error: %(error)s"

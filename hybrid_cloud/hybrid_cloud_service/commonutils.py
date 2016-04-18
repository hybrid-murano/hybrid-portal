import os
import time
import sshclient
from hcaas_exception import *
import logging
logger = logging.getLogger(__name__)

def check_host_status(host, user, password, retry_time=100, interval=1):
    logger.info("check host status, host: %s" % host)
    ssh = sshclient.SSH(host=host, user=user, password=password)
    for i in range(retry_time):
        try:
            ssh.execute("ls")
            logger.info("host is ok, host: %s" % host)
            return True
        except Exception as e:
            logger.error("error: %s" % e.message)
            time.sleep(interval)
            continue
    logger.error("check host status failed, host = % s" % host)
    raise CheckHostStatusFailure(host=host)


def execute_cmd_without_stdout(host, user, password, cmd):
    logger.debug("execute ssh command, host = %s, cmd = %s" % (host, cmd))
    ssh = sshclient.SSH(host=host, user=user, password=password)
    try:
        operate_result = ssh.execute(cmd)
    except Exception as e:
        logger.error("execute ssh command failed: host: %s, cmd: %s, error: %s"
                     % (ssh.host, cmd, e.message))
        raise SSHCommandFailure(host=ssh.host, command=cmd, error=e.message)
    finally:
        ssh.close()

    exit_code = operate_result[0]
    if exit_code == 0:
        return True
    else:
        logger.error(
            "execute ssh command failed: host = %s, cmd = %s, reason = %s"
            % (ssh.host, cmd, operate_result[2]))
        raise SSHCommandFailure(
            host=ssh.host, command=cmd, error=operate_result[2])


def execute_cmd_with_stdout(host, user, password, cmd):
    logger.debug("execute ssh command, host = %s, cmd = %s" % (host, cmd))
    ssh = sshclient.SSH(host=host, user=user, password=password)
    try:
        operate_result = ssh.execute(cmd)
    except Exception as e:
        logger.error(
            "execute ssh command failed: host = %s, cmd = %s, reason = %s"
            % (ssh.host, cmd, e.message))
        raise SSHCommandFailure(host=ssh.host, command=cmd, error=e.message)
    finally:
        ssh.close()

    exit_code = operate_result[0]
    if exit_code == 0:
        return operate_result[1]
    else:
        logger.error(
            "execute ssh command failed: host = %s, cmd = %s, reason = %s"
            % (ssh.host, cmd, operate_result[2]))
        raise SSHCommandFailure(
            host=ssh.host, command=cmd, error=operate_result[2])


def scp_file_to_host(host, user, password, file_name, local_dir, remote_dir):
    logger.debug("spc file to host, host = %s, file_name = %s, "
                 "local_dir = %s, remote_dir = %s"
                 % (host, file_name, local_dir, remote_dir))
    ssh = sshclient.SSH(host=host, user=user, password=password)
    try:
        ssh.put_file(os.path.join(local_dir, file_name),
                     remote_dir + "/" + file_name)
    except (sshclient.SSHError, sshclient.SSHTimeout) as e:
        logger.error(
            "spc file to host failed, host = %s, "
            "file_name = %s, local_dir = %s, remote_dir = %s, reason = %s"
            % (ssh.host, file_name, local_dir, remote_dir, e.message))
        raise ScpFileToHostFailure(host=ssh.host, file_name=file_name,
                                   local_dir=local_dir,
                                   remote_dir=remote_dir,
                                   error=e.message)
    finally:
        ssh.close()

    return True

# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2004-2010 Tiny SPRL (<http://tiny.be>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'Hybrid Cloud',
    'version': '1.0',
    'author': 'chenyujie',
    'category': 'Hybrid Cloud',
    'sequence': 10,
    'website': 'https://github.com/Hybrid-Cloud/hybrid_cloud/wiki',
    'summary': 'Clouds, Services, Users Details',
    'description': """
Hybrid Cloud As A Service
=====================================

This application enables you to manage important aspects of your cloud's user and other details such as their email, address, working status..., and controls the Hybrid Cloud.

It allows people to request Hybrid Cloud Service. Then, managers can review requests for requests and approve or reject them. This way you can control the overall hybrid cloud planning for the company or department.

You can configure several kinds of hybrid cloud (AWS, vCloud, Fusion Sphere, ...) and allocate a hybrid cloud service end-point.

You can manage:
---------------
* Clients and hierarchies : You can define your client with User and display hierarchies
* Clouds
    """,
    'depends': [
        'website',
        'portal',
        'resource',
    ],
    'data': [
        'security/hybrid_security.xml',
        'security/ir.model.access.csv',
        'hybrid_view.xml',
        'hybrid_installer.xml',
        'hybrid_data.xml',
#        'res_config_view.xml',
#        'mail_hybrid_view.xml',
        'res_users_view.xml',
        'views/hybrid.xml',
        'views/pages.xml',
    ],
    'demo': ['hybrid_demo.xml'],
    'test': [
        'test/hybrid_users.yml',
        'test/open2recruit2close_job.yml',
        'test/hybrid_demo.yml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'qweb': [ 'static/src/xml/*.xml' ],
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

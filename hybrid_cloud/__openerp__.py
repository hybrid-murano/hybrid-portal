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

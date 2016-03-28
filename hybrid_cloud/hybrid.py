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

import logging

from openerp import SUPERUSER_ID
from openerp import tools
from openerp.modules.module import get_module_resource
from openerp.osv import fields, osv
from openerp.tools.translate import _

_logger = logging.getLogger(__name__)

from openerp import http
from openerp.http import request
import werkzeug.wrappers

class Cloud(http.Controller):
    @http.route('/cloud', type='http', auth="none")
    def web_client(self, s_action=None, **kw):
        if request.session.uid:
            if kw.get('redirect'):
                return werkzeug.utils.redirect(kw.get('redirect'), 303)
            if not request.uid:
                request.uid = request.session.uid

            menu_data = request.registry['ir.ui.menu'].load_menus(request.cr, request.uid, context=request.context)
            _logger.info("menu data: %s", menu_data)
            return request.render('web.webclient_bootstrap', qcontext={'menu_data': menu_data})
        else:
            return login_redirect()

def login_redirect():
    url = '/web/login?'
    # built the redirect url, keeping all the query parameters of the url
    redirect_url = '%s?%s' % (request.httprequest.base_url, werkzeug.urls.url_encode(request.params))
    return """<html><head><script>
        window.location = '%sredirect=' + encodeURIComponent("%s" + location.hash);
    </script></head></html>
    """ % (url, redirect_url)

class hybrid_cloud(osv.Model):

    def name_get(self, cr, uid, ids, context=None):
        if not ids:
            return []
        reads = self.read(cr, uid, ids, ['name',], context=context)
        res = []
        for record in reads:
            name = record['name']
            res.append((record['id'], name))
        return res

    def _name_get_fnc(self, cr, uid, ids, prop, unknow_none, context=None):
        res = self.name_get(cr, uid, ids, context=context)
        return dict(res)
    
    regions = [
        ('ap-northeast-1', 'Tokyo'),
        ('ap-southeast-1', 'Singapore'),
        ('ap-southeast-2', 'Sydney'),
        ('eu-west-1', 'Ireland'),
        ('sa-east-1', 'Sao Paulo'),
        ('virginia', 'N. Virginia'),
        ('us-west-1', 'N. California'),
        ('us-west-2', 'Oregon'),
    ]

    _name = "hybrid.cloud"
    _description = "Hybrid Cloud"
    _columns = {
        'name': fields.char("Cloud Tag", required=True),
        'region': fields.selection(regions, 'Region'),
        'az': fields.char("Available Zone", required=True),
        'ak': fields.char("Access Key", required=True),
        'sk': fields.char("Secret Key", required=True),
        'endpoint': fields.char("Endpoint", required=True),
        'complete_name': fields.function(_name_get_fnc, type="char", string='Name'),
        'employee_ids': fields.many2many('hybrid.user', 'employee_category_rel', 'category_id', 'emp_id', 'Employees'),
    }

class hybrid_user(osv.Model):
    _name = "hybrid.user"
    _description = "User"
    _order = 'name_related'
    _inherits = {'resource.resource': "resource_id"}
    _inherit = ['mail.thread']

    _mail_post_access = 'read'

    def _get_image(self, cr, uid, ids, name, args, context=None):
        result = dict.fromkeys(ids, False)
        for obj in self.browse(cr, uid, ids, context=context):
            result[obj.id] = tools.image_get_resized_images(obj.image)
        return result

    def _set_image(self, cr, uid, id, name, value, args, context=None):
        return self.write(cr, uid, [id], {'image': tools.image_resize_image_big(value)}, context=context)

    _columns = {
        #we need a related field in order to be able to sort the employee by name
        'name_related': fields.related('resource_id', 'name', type='char', string='Name', readonly=True, store=True),
        'country_id': fields.many2one('res.country', 'Nationality'),
        'birthday': fields.date("Date of Birth"),
        'ssnid': fields.char('SSN No', help='Social Security Number'),
        'sinid': fields.char('SIN No', help="Social Insurance Number"),
        'identification_id': fields.char('Identification No'),
        'otherid': fields.char('Other Id'),
        'gender': fields.selection([('male', 'Male'), ('female', 'Female')], 'Gender'),
        'marital': fields.selection([('single', 'Single'), ('married', 'Married'), ('widower', 'Widower'), ('divorced', 'Divorced')], 'Marital Status'),
        'department_id': fields.many2one('hybrid.department', 'Department'),
        'address_id': fields.many2one('res.partner', 'Working Address'),
        'address_home_id': fields.many2one('res.partner', 'Home Address'),
        'bank_account_id': fields.many2one('res.partner.bank', 'Bank Account Number', domain="[('partner_id','=',address_home_id)]", help="Employee bank salary account"),
        'work_phone': fields.char('Work Phone', readonly=False),
        'mobile_phone': fields.char('Work Mobile', readonly=False),
        'work_email': fields.char('Work Email', size=240),
        'work_location': fields.char('Office Location'),
        'notes': fields.text('Notes'),
        'category_ids': fields.many2many('hybrid.cloud', 'employee_category_rel', 'emp_id', 'category_id', 'Tags'),
        'resource_id': fields.many2one('resource.resource', 'Resource', ondelete='cascade', required=True, auto_join=True),
        'coach_id': fields.many2one('hybrid.user', 'Coach'),
        # image: all image fields are base64 encoded and PIL-supported
        'image': fields.binary("Photo",
            help="This field holds the image used as photo for the employee, limited to 1024x1024px."),
        'image_medium': fields.function(_get_image, fnct_inv=_set_image,
            string="Medium-sized photo", type="binary", multi="_get_image",
            store = {
                'hybrid.user': (lambda self, cr, uid, ids, c={}: ids, ['image'], 10),
            },
            help="Medium-sized photo of the employee. It is automatically "\
                 "resized as a 128x128px image, with aspect ratio preserved. "\
                 "Use this field in form views or some kanban views."),
        'image_small': fields.function(_get_image, fnct_inv=_set_image,
            string="Small-sized photo", type="binary", multi="_get_image",
            store = {
                'hybrid.user': (lambda self, cr, uid, ids, c={}: ids, ['image'], 10),
            },
            help="Small-sized photo of the employee. It is automatically "\
                 "resized as a 64x64px image, with aspect ratio preserved. "\
                 "Use this field anywhere a small image is required."),
        'passport_id': fields.char('Passport No'),
        'color': fields.integer('Color Index'),
        'city': fields.related('address_id', 'city', type='char', string='City'),
        'login': fields.related('user_id', 'login', type='char', string='Login', readonly=1),
        'last_login': fields.related('user_id', 'date', type='datetime', string='Latest Connection', readonly=1),
    }

    def _get_default_image(self, cr, uid, context=None):
        image_path = get_module_resource('hybrid', 'static/src/img', 'default_image.png')
        return tools.image_resize_image_big(open(image_path, 'rb').read().encode('base64'))

    defaults = {
        'active': 1,
        'image': _get_default_image,
        'color': 0,
    }

    def _broadcast_welcome(self, cr, uid, employee_id, context=None):
        """ Broadcast the welcome message to all users in the employee company. """
        employee = self.browse(cr, uid, employee_id, context=context)
        partner_ids = []
        _model, group_id = self.pool['ir.model.data'].get_object_reference(cr, uid, 'base', 'group_user')
        if employee.user_id:
            company_id = employee.user_id.company_id.id
        elif employee.company_id:
            company_id = employee.company_id.id
        elif employee.department_id:
            company_id = employee.department_id.company_id.id
        else:
            company_id = self.pool['res.company']._company_default_get(cr, uid, 'hybrid.user', context=context)
        res_users = self.pool['res.users']
        user_ids = res_users.search(
            cr, SUPERUSER_ID, [
                ('company_id', '=', company_id),
                ('groups_id', 'in', group_id)
            ], context=context)
        partner_ids = list(set(u.partner_id.id for u in res_users.browse(cr, SUPERUSER_ID, user_ids, context=context)))
        self.message_post(
            cr, uid, [employee_id],
            body=_('Welcome to %s! Please help him/her take the first steps with us!') % (employee.name),
            partner_ids=partner_ids,
            subtype='mail.mt_comment', context=context
        )
        return True

    def create(self, cr, uid, data, context=None):
        context = dict(context or {})
        if context.get("mail_broadcast"):
            context['mail_create_nolog'] = True

        employee_id = super(hybrid_user, self).create(cr, uid, data, context=context)

        if context.get("mail_broadcast"):
            self._broadcast_welcome(cr, uid, employee_id, context=context)
        return employee_id

    def unlink(self, cr, uid, ids, context=None):
        resource_ids = []
        for employee in self.browse(cr, uid, ids, context=context):
            resource_ids.append(employee.resource_id.id)
        super(hybrid_user, self).unlink(cr, uid, ids, context=context)
        return self.pool.get('resource.resource').unlink(cr, uid, resource_ids, context=context)

    def onchange_address_id(self, cr, uid, ids, address, context=None):
        if address:
            address = self.pool.get('res.partner').browse(cr, uid, address, context=context)
            return {'value': {'work_phone': address.phone, 'mobile_phone': address.mobile}}
        return {'value': {}}

    def onchange_company(self, cr, uid, ids, company, context=None):
        address_id = False
        if company:
            company_id = self.pool.get('res.company').browse(cr, uid, company, context=context)
            address = self.pool.get('res.partner').address_get(cr, uid, [company_id.partner_id.id], ['default'])
            address_id = address and address['default'] or False
        return {'value': {'address_id': address_id}}

    def onchange_department_id(self, cr, uid, ids, department_id, context=None):
        value = {'parent_id': False}
        if department_id:
            department = self.pool.get('hybrid.department').browse(cr, uid, department_id)
            value['parent_id'] = department.manager_id.id
        return {'value': value}

    def onchange_user(self, cr, uid, ids, user_id, context=None):
        work_email = False
        if user_id:
            work_email = self.pool.get('res.users').browse(cr, uid, user_id, context=context).email
        return {'value': {'work_email': work_email}}

    def action_follow(self, cr, uid, ids, context=None):
        """ Wrapper because message_subscribe_users take a user_ids=None
            that receive the context without the wrapper. """
        return self.message_subscribe_users(cr, uid, ids, context=context)

    def action_unfollow(self, cr, uid, ids, context=None):
        """ Wrapper because message_unsubscribe_users take a user_ids=None
            that receive the context without the wrapper. """
        return self.message_unsubscribe_users(cr, uid, ids, context=context)

    def get_suggested_thread(self, cr, uid, removed_suggested_threads=None, context=None):
        """Show the suggestion of employees if display_employees_suggestions if the
        user perference allows it. """
        user = self.pool.get('res.users').browse(cr, uid, uid, context)
        if not user.display_employees_suggestions:
            return []
        else:
            return super(hybrid_user, self).get_suggested_thread(cr, uid, removed_suggested_threads, context)

    def _message_get_auto_subscribe_fields(self, cr, uid, updated_fields, auto_follow_fields=None, context=None):
        """ Overwrite of the original method to always follow user_id field,
        even when not track_visibility so that a user will follow it's employee
        """
        if auto_follow_fields is None:
            auto_follow_fields = ['user_id']
        user_field_lst = []
        for name, field in self._fields.items():
            if name in auto_follow_fields and name in updated_fields and field.comodel_name == 'res.users':
                user_field_lst.append(name)
        return user_field_lst


class hybrid_department(osv.Model):

    def _dept_name_get_fnc(self, cr, uid, ids, prop, unknow_none, context=None):
        res = self.name_get(cr, uid, ids, context=context)
        return dict(res)

    _name = "hybrid.department"
    _columns = {
        'name': fields.char('Department Name', required=True),
        'complete_name': fields.function(_dept_name_get_fnc, type="char", string='Name'),
        'company_id': fields.many2one('res.company', 'Company', select=True, required=False),
        'manager_id': fields.many2one('hybrid.user', 'Manager'),
        'member_ids': fields.one2many('hybrid.user', 'department_id', 'Members', readonly=True),
        'note': fields.text('Note'),
    }

    _defaults = {
        'company_id': lambda self, cr, uid, c: self.pool.get('res.company')._company_default_get(cr, uid, 'hybrid.department', context=c),
    }

    def name_get(self, cr, uid, ids, context=None):
        if context is None:
            context = {}
        if not ids:
            return []
        if isinstance(ids, (int, long)):
            ids = [ids]
        reads = self.read(cr, uid, ids, ['name',], context=context)
        res = []
        for record in reads:
            name = record['name']
            res.append((record['id'], name))
        return res


class res_users(osv.osv):
    _name = 'res.users'
    _inherit = 'res.users'
    _columns = {
        'employee_ids': fields.one2many('hybrid.user', 'user_id', 'Related employees'),
    }


# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

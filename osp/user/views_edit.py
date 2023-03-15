from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.db.models import Avg, Sum, Subquery
from django.views.generic import TemplateView
from django.views.generic.edit import UpdateView, DeleteView
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.files.images import get_image_dimensions

from tag.models import Tag

from user.models import StudentTab, Account, AccountInterest, AccountPrivacy
from user.forms import ProfileImgUploadForm
from user.templatetags.gbti import get_type_test, get_type_analysis
import os
import json
import time

class ProfileEditView(TemplateView):
    '''
    유저 프로필 수정 페이지
    url        : /user/<username>
    template   : profile/profile.html 

    Returns :
        GET     : render, redirect
    '''

    def get_context_data(self, request, *args, **kwargs):
        # context 는 username과 view 인스턴스를 가진 딕셔너리
        context = super().get_context_data(**kwargs)
        if str(request.user) != context["username"] : # 타인이 edit페이지 접속 시도시 프로필 페이지로 돌려보냄
            print("허용되지 않는 접근 입니다.")
            context['valid'] = 0
            return context
        context['valid'] = 1
        username = context['username']
        user = User.objects.get(username=username)

        student_account = Account.objects.get(user=user.id)
        student_id = student_account.student_data.id

        tags_domain = Tag.objects.filter(type='domain')

        lang = []
        lang_lv0 = []
        lang_lv1 = []
        lang_lv2 = []
        lang_lv3 = []
        lang_lv4 = []

        lang_tags = Tag.objects.filter(name__in = AccountInterest.objects.filter(account=student_account).exclude(tag__type="domain").values("tag")).order_by("name")
        account_lang = AccountInterest.objects.filter(account=student_account, tag__in=lang_tags).exclude(tag__type="domain").order_by("tag__name")
        level_list = [ al.level for al in account_lang ]
        for tag in lang_tags:
            lang_tag_dict = {"name":tag.name, "type":tag.type }
            lang_tag_dict["level"] = level_list[len(lang)]
            lang_tag_dict["logo"] = tag.logo
            lang_tag_dict["color"] = tag.color

            hexcolor = tag.color[1:]
            r = int(hexcolor[0:2], 16) & 0xff
            g = int(hexcolor[2:4], 16) & 0xff
            b = int(hexcolor[4:6], 16) & 0xff 
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if luma < 127.5:
                lang_tag_dict["fontcolor"] = "white"
            else:
                lang_tag_dict["fontcolor"] = "black"
            lang.append(lang_tag_dict)
            if lang_tag_dict["level"] == 0:
                lang_lv0.append(lang_tag_dict)
            if lang_tag_dict["level"] == 1:
                lang_lv1.append(lang_tag_dict)
            if lang_tag_dict["level"] == 2:
                lang_lv2.append(lang_tag_dict)
            if lang_tag_dict["level"] == 3:
                lang_lv3.append(lang_tag_dict)
            if lang_tag_dict["level"] == 4:
                lang_lv4.append(lang_tag_dict)
        lang.sort(key=lambda la: la['level'], reverse=True)
        
        context["account"] = Account.objects.get(user=user.id)
        context["info"] = StudentTab.objects.get(id=student_id)
        context["ints"] = AccountInterest.objects.filter(account=student_account).filter(tag__in=tags_domain)
        context["lang"] = AccountInterest.objects.filter(account=student_account).exclude(tag__in=tags_domain)
        context["privacy"] = AccountPrivacy.objects.get(account=student_account)
        context["lang_lv0"] = lang_lv0
        context["lang_lv1"] = lang_lv1
        context["lang_lv2"] = lang_lv2
        context["lang_lv3"] = lang_lv3
        context["lang_lv4"] = lang_lv4
        return context

    def get(self, request, *args, **kwargs):

        context = self.get_context_data(request, *args, **kwargs)
        if(context['valid'] == 0):
            return redirect(f'/user/{context["username"]}/')

        return render(request, 'profile/profile-edit.html', context)
    


class ProfileInterestsView(UpdateView):
    def post(self, request, username, *args, **kwargs):
        print(request.POST)
        print(request.POST['act'])
        user = User.objects.get(username=username)
        user_account = Account.objects.get(user=user.id)
        student_id = user_account.student_data.id
        tags_all = Tag.objects
        if request.POST['act'] == 'append':
            added_preferLanguage = request.POST.get('interestDomain') # 선택 된 태그
            added_tag = Tag.objects.get(name=added_preferLanguage)
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
                already_ints.delete()
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=0)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=0)

        else:
            delete_requested_tag = Tag.objects.get(name=request.POST['target'])
            tag_deleted = AccountInterest.objects.get(account=user_account, tag=delete_requested_tag).delete()
            print("Selected tag is successfully deleted")

        return JsonResponse({'data':'asdfas'})

class ProfileLanguagesView(UpdateView):

    def post(self, request, username, *args, **kwargs):

        added_preferLanguage = request.POST.get('preferLanguage') # 선택 된 태그
        added_tag = Tag.objects.get(name=added_preferLanguage)
        name = added_tag.name
        logo = added_tag.logo
        color = added_tag.color
        hexcolor = color[1:]
        print(logo)
        print(color)

        r = int(hexcolor[0:2], 16) & 0xff
        g = int(hexcolor[2:4], 16) & 0xff
        b = int(hexcolor[4:6], 16) & 0xff 
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if luma < 127.5:
            fontcolor = "white"
        else:
            fontcolor = "black"

        return JsonResponse({'name': name, 'logo' : logo, 'color': color, 'fontcolor' : fontcolor})
    '''
    def post(self, request, username, *args, **kwargs):
        print(request.POST)
        print(request.POST['act'])
        print(request.POST['target'])
        user = User.objects.get(username=username)
        user_account = Account.objects.get(user=user.id)
        student_id = user_account.student_data.id
        tags_all = Tag.objects
        tags_domain = tags_all.filter(type='domain')

        if request.POST['act'] == 'append':
            added_preferLanguage = request.POST.get('preferLanguage') # 선택 된 태그
            added_tag = Tag.objects.get(name=added_preferLanguage)
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=1)


            lang = AccountInterest.objects.filter(account=user_account).exclude(tag__in=tags_domain)
            for l in lang:
                if "tag_" + l.tag.name in request.POST:
                    added_tag = Tag.objects.get(name=l.tag.name)
                    AccountInterest.objects.filter(account=user_account, tag=added_tag).update(level=request.POST.get("tag_" + l.tag.name))
            return JsonResponse({'color':'asdfas', })
        else:
            delete_requested_tag = Tag.objects.get(name=request.POST['target'])
            tag_deleted = AccountInterest.objects.get(account=user_account, tag=delete_requested_tag).delete()
            print("Selected tag is successfully deleted")
            return JsonResponse({'data':'asdfas'})
    '''


class ProfileImageView(UpdateView):

    def post(self, request, username, *args, **kwargs):
        print("asdfds")
        print('img 상태dffffffffffffffffffffffffff')
        user = User.objects.get(username=username)
        
        user_account = Account.objects.get(user=user.id)

        pre_img = user_account.photo.path
        field_check_list = {}
        profile_img = request.FILES.get('photo', False)
        
        print(profile_img)
        is_valid = True
        print(request.POST.get('is_default'))
        if request.POST.get('is_default') == 'true':
            print("is true!!")


        if profile_img:
            img_width, img_height = get_image_dimensions(profile_img)
            print(img_width, img_height)
            if img_width > 500 or img_height > 500:
                is_valid = False
                field_check_list['photo'] = f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px'
                print(f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px')

        img_form = ProfileImgUploadForm(request.POST, request.FILES, instance=user_account)
        print(img_form)
        print(pre_img)
        if bool(img_form.is_valid()) and is_valid:
            if 'photo' in request.FILES: # 폼에 이미지가 있으면
                print('form에 이미지 존재')
                try:
                    print(" path of pre_image is "+ pre_img)
                    if(pre_img.split("/")[-1] == "default.jpg" or pre_img.split("\\")[-1] == "default.jpg"):
                        pass
                    else:
                        print(pre_img.split("/")[-1])
                        os.remove(pre_img) # 기존 이미지 삭제
                
                except:                # 기존 이미지가 없을 경우에 pass
                    pass    

            print('Image is valid form')
            img_form.save()

        else:
            print(field_check_list['photo'])
        return redirect(f'/user/{username}/')

class ProfileImageDefaultView(DeleteView):
    def post(self, request, username, *args, **kwargs):
        user = User.objects.get(username=username)
        
        user_account = Account.objects.get(user=user.id)
        user_account.photo = "img/profile_img/default.jpg"
        user_account.save()
        return redirect(f'/user/{username}/')



class ProfileEditSaveView(UpdateView):
    def post(self, request, username, *args, **kwargs):
        start = time.time()

        user = User.objects.get(username=username)
        user_account = Account.objects.get(user=user.id)
        student_id = user_account.student_data.id
        user_tab = StudentTab.objects.get(id=student_id)
        tags_all = Tag.objects
        tags_domain = tags_all.filter(type='domain')
        user_privacy = AccountPrivacy.objects.get(account=user_account)

        print(request.POST)
        req = json.loads(request.body.decode('utf-8'))

        tier0langs = req["tier0langs"]
        tier1langs = req["tier1langs"]
        tier2langs = req["tier2langs"]
        tier3langs = req["tier3langs"]
        tier4langs = req["tier4langs"]

        # 기존에 있던 사용언어/기술스택을 모두 삭제하고 다시 삽입한다.
        AccountInterest.objects.filter(account=user_account).exclude(tag__in=tags_domain).delete()
        
        query_bulk = []
        def langupdater(tier, level):
            for lang, val in tier.items() :
                lang_tag = Tag.objects.get(name=val.replace("_", " "))
                new_interest_obj = AccountInterest(account=user_account, tag=lang_tag, level=level)
                query_bulk.append(new_interest_obj)

        langupdater(tier0langs, 0)
        langupdater(tier1langs, 1)
        langupdater(tier2langs, 2)
        langupdater(tier3langs, 3)
        langupdater(tier4langs, 4)
        AccountInterest.objects.bulk_create(query_bulk)

        end = time.time()
        print("걸린시간은")
        print(end-start)
        user_tab.plural_major = req['plural_major']
        user_tab.personal_email = req['personal_email']
        user_tab.primary_email = req['primary_email']
        user_tab.secondary_email = req['secondary_email']
        user_tab.save()

        user_account.introduction = req['introduction']
        user_account.portfolio = req['portfolio']
        user_account.save()


        user_privacy.open_lvl = req['profileprivacy']
        user_privacy.is_write = req['articleprivacy']
        user_privacy.is_open = req['teamprivacy']
        user_privacy.save()


        return redirect(f'/user/{username}/')

class ProfilePasswdView(UpdateView):
    def post(self, request, username, *args, **kwargs):
        user = User.objects.get(username=username)

        if(user.check_password(request.POST['inputOldPassword']) == False):
            return JsonResponse({"status" : "error"})

        if(request.POST['inputNewPassword'] != request.POST['inputValidPassword']):
            return JsonResponse({"status" : "error"})

        user.set_password(request.POST['inputNewPassword'])
        user.save()
        print("비밀번호가 변경되었습니다. ")
        return 1

def InitAllPassword():
    users = User.objects.all()
    accounts = Account.objects.filter(user__is_superuser = False)
    for account in accounts:
        user = users.get(id=account.user.id)
        user.set_password(str(account.student_data.id))
        user.save()

    return

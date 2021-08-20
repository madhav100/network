
from django.core.paginator import Paginator
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post, Relationship
from .serializers import PostSerializer

def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords do not match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "This username already exists."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def modify(request, id):
    post = Post.objects.get(id=id)
    
    if request.user != post.author:
        return HttpResponse('You do not have permission to edit this post.')

    data = json.loads(request.body)
    post.message = data['message']
    post.save()
    
    return JsonResponse({'message' : data['message']})    

def follow(request, username):
    user = User.objects.get(username=username)

    if request.user == user:
        return HttpResponse('User cannpt follow himself')

    # query DB to check whether current user is already following
    follow_object = user.relationships_to.filter(from_user=request.user, status=1)

    # create or delete follow object, depending on DB query
    if follow_object:
        follow_object.delete()
        is_followed = False
    else:
        follow_object = Relationship(from_user=request.user, to_user=user, status=1)
        follow_object.save()
        is_followed = True

    # respond with data to rebuilt profile on FE
    response = {
        'username' : user.username,
        'post_count' : user.posts.count(),
        'following' : user.relationships_from.count(),
        'followed_by' : user.relationships_to.count(),
        'is_followed' : is_followed,
        'join_date' : f'{user.date_joined.strftime("%B")} {user.date_joined.strftime("%Y")}',
        'requested_by' : request.user.username if request.user.is_authenticated else None,
    }
    return JsonResponse(response, status=200)    

def profile(request, username):
    user = User.objects.get(username=username)
    
    if not request.user.is_authenticated:
        is_followed = False
    elif user.relationships_to.filter(from_user=request.user, status=1):
        is_followed = True
    else:
        is_followed = False

    response = {
        'username' : user.username,
        'post_count' : user.posts.count(),
        'following' : user.relationships_from.count(),
        'followed_by' : user.relationships_to.count(),
        'is_followed' : is_followed or None,
        'join_date' : f'{user.date_joined.strftime("%B")} {user.date_joined.strftime("%Y")}',
        'requested_by' : request.user.username if request.user.is_authenticated else None,
    }
    return JsonResponse(response, status=200)

def posts(request):
    page_num = int(request.GET.get("page"))
    num_of_posts = int(request.GET.get("perPage"))
    user = request.GET.get("user") or None
    feed = request.GET.get("feed") or None

    # if feed flag is raised, get posts of users request.user is following
    if feed:
        follow_relationships = request.user.relationships_from.filter(status=1) # Relationships 
        following = User.objects.filter(id__in=follow_relationships.values('to_user')) # Users
        posts = Post.objects.filter(author__in=following) # Posts       

    # if user flag is raised, get posts by a specific user
    elif user:
        user_obj = User.objects.get(username=user)
        posts = Post.objects.filter(author=user_obj)  

    # else get all posts
    else:
        posts = Post.objects.all()
    

    # handle pagination and serialize posts
    paginator = Paginator(posts, num_of_posts)
    page = paginator.get_page(page_num)
    serializer = PostSerializer(page, many=True)

    response = {
        "requested_by" : request.user.username,
        "page" : page_num,
        "page_count" : paginator.num_pages,
        "has_next_page" : page.has_next(),
        "has_previous_page" : page.has_previous(),
        "posts" : serializer.data,
    }
    return JsonResponse(response, status=200)
def submit(request):
    if request.method != "POST":
        return render(request, "index.html")  

    # Add new post to DB
    data = json.loads(request.body)
    post = Post(author=request.user, message=data['message'])
    post.save()
    serializer = PostSerializer(post)

    # Respond with the new post in JSON
    return JsonResponse(serializer.data, status=200)
def like(request, id):
    post = Post.objects.get(id=id)
    state = json.loads(request.body)['state']

    # check if this is a like or an unlike & update DB 
    if state == 'like':
        post.liked_by.add(request.user)
    elif state == 'unlike':
        post.liked_by.remove(request.user)
    post.save()
    
    # return JSON string of new likes count and toggled state
    response = {
        'state': "unlike" if state == "like" else "like",
        'likes' : post.liked_by.count(),
    }
    return JsonResponse(response, status=200)


from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("submit", views.submit, name="submit"),
    path("posts", views.posts, name="posts"),
    path("post/<str:id>", views.modify, name="modify"),
    path("post/<str:id>/like", views.like, name="like"),
    path("user/<str:username>", views.profile, name="profile"),
    path("user/<str:username>/follow", views.follow, name="follow"),
]

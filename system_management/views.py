from django.shortcuts import render

# Create your views here.
def home(request):
    render("system_management\home.html",context={})
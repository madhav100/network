import { headers, cookie } from './cookie.js';
import { edit_btn, like_btn, load_post, load_profile } from './side.js';

let page_num = 1;
const num_of_posts = 10;
let this_view = 'index';


const csrftoken = cookie('csrftoken');

document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#index-nav-link').addEventListener('click', () => load_view('index'));
    document.querySelector('#btn-next-page').addEventListener('click', next_pg);
    document.querySelector('#btn-previous-page').addEventListener('click', previous_pg);



    if (document.querySelector('#following-nav-link')) {
        document.querySelector('#following-nav-link').addEventListener('click', () => load_view('feed'));
    }

    const post_form = document.querySelector('#post-form')
    if (post_form) {
        post_form.addEventListener('submit', submit);
    }
    load_view('index');
})


function previous_pg() {
    page_num--;
    load_posts(this_view, page_num, num_of_posts);
}

function next_pg() {
    page_num++;
    load_posts(this_view, page_num, num_of_posts);
}


function update_posts_postion(data) {
    document.querySelector('#btn-next-page').style.display =
        data["has_next_page"] ? "block" : "none";

    document.querySelector('#btn-previous-page').style.display =
        data["has_previous_page"] ? "block" : "none";

    document.querySelector('#page-number').innerHTML = `
    Page ${data["page"]} of ${data["page_count"]}
  `;
}


function submit(event) {
    event.preventDefault();

    // create POST request using form data
    fetch('/submit', {
            method: 'POST',
            headers: headers(csrftoken),
            body: JSON.stringify({
                'message': document.querySelector('#post-form-msg').value
            })
        })
        .then(response => response.json())
        .then(post => {
            addPostToDOM({ 'post': post, 'user': post.author, 'position': 'front' })
            document.querySelector('#post-form-msg').value = "";
        })
}

function post_title(post) {
    // make a GET request to the user profile API route
    fetch(`user/${post.author}`)
        .then(response => response.json())
        .then(data => {
            add_profile_to_DOM(data);
            load_view('profile');
        })
}

function follow(contents) {
    fetch(`user/${contents['username']}/follow`)
        .then(response => response.json())
        .then(data => {
            add_profile_to_DOM(data);
        })
}

function like(post) {
    const like_btn_toggle = post.querySelector('.like-btn') ? 'like' : 'unlike';
    fetch(`post/${post.id}/like`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: headers(csrftoken),
            body: JSON.stringify({
                'state': like_btn_toggle
            })
        })
        .then(response => response.json())
        .then(data => {
            post.querySelector(`.${like_btn_toggle}-btn`).className = `${data['state']}-btn`;
            post.querySelector('.counter-txt').innerHTML = data['likes'];
        })
}

function edit(target) {
    const post = target.querySelector('.card-text');
    const postID = target.id;
    const textArea = target.querySelector('.card-text-editor');
    const button = target.querySelector('.edit-btn');

    if (button.innerHTML === "Edit") {
        button.innerHTML = "Save";
        post.style.display = "none";
        textArea.style.display = "block";
        textArea.value = post.innerHTML;
    } else {
        fetch(`post/${postID}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: headers(csrftoken),
                body: JSON.stringify({
                    'message': textArea.value
                })
            })
            .then(() => {
                button.innerHTML = "Edit";
                post.innerHTML = textArea.value;
                textArea.value = "";
                post.style.display = "block";
                textArea.style.display = "none";
            })

    }
}


function load_view(view) {
    this_view = view;
    page_num = 1;

    const profile_div = document.querySelector('#profile-div-container');
    profile_div.style.display = (view === 'profile') ? 'block' : 'none';

    const post_form_div = document.querySelector('#post-form-div');
    post_form_div.style.display = (view === 'index') ? 'block' : 'none';

    load_posts(this_view, page_num, num_of_posts);
}

function load_posts(this_view, page_num, num_of_posts) {

    // remove old posts from the DOM
    document.querySelector('#post-display-div').innerHTML = "";

    // compose url for GET request
    let url = `/posts?page=${page_num}&perPage=${num_of_posts}`;

    if (this_view === 'profile') {
        url = url.concat(`&user=${document.querySelector('#profile-div-title').innerHTML}`);
    }

    if (this_view === 'feed') {
        url = url.concat(`&feed=true`)
    }

    // make GET request to '/posts' route & consume API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.posts.forEach(post => addPostToDOM({
                'post': post,
                'user': data['requested_by'],
                'position': 'end'
            }));
            update_posts_postion(data);
        })
}



function addPostToDOM(context) {
    const post = load_post(context);

    // add listener to title (loads profile on click)
    const title = post.querySelector(".post-title");
    title.addEventListener('click', () => post_title(context.post));

    // add a like btn if the user is signed in
    if (context.user) {
        const user_likes = context.post.liked_by;

        // set like btn state according to whether user likes post
        let like_btn_toggle = 'like';
        user_likes.forEach(user_like => {
            if (user_like === context.user) like_btn_toggle = 'unlike';
        })
        const likeButton = like_btn(like_btn_toggle, user_likes.length);
        post.querySelector('.post-body').appendChild(likeButton);

        likeButton.firstChild.addEventListener('click', () => {
            like(post);
        })
    }

    if (title.innerHTML === context.user) {
        const editor = edit_btn();
        editor.addEventListener('click', () => {
            edit(post);
        })
        post.querySelector('.post-body').appendChild(editor);
    }


    if (context.position === 'end') {
        document.querySelector('#post-display-div').append(post);
    } else {
        post.style.animationName = 'fade-in';
        post.style.animationDuration = '6s';
        document.querySelector('#post-display-div').prepend(post);
    }
}

function add_profile_to_DOM(contents) {
    const profile = load_profile(contents);
    const follow_btn = profile.querySelector("#follow-button")
    if (follow_btn) {
        follow_btn.addEventListener('click', () => follow(contents))
    }

    // replace old profile HTML with new
    document.querySelector("#profile-div-container").innerHTML = "";
    document.querySelector("#profile-div-container").appendChild(profile);
}
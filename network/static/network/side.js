export function edit_btn() {
    const button = document.createElement('button');
    button.type = "button";
    button.className = "d-inline-block float-right edit-btn btn btn-outline-light";
    button.innerHTML = "Edit";
    return button;
}

export function like_btn(label, count) {
    const button = document.createElement('button');
    button.type = "button";
    button.className = `${label}-btn`;
    button.innerHTML = `<img id="img" src="/static/network/2764.png">`;

    const likeCounter = document.createElement('span');
    likeCounter.className = `counter-txt`
    likeCounter.innerHTML = `${count}`

    const likeDiv = document.createElement('div');
    likeDiv.className = "d-inline-block"
    likeDiv.appendChild(button);
    button.appendChild(likeCounter);
    return likeDiv;
}

export function load_post(context) {
    const post = document.createElement('div');
    post.className = "post card";
    post.id = `${context.post.id}`;
    post.innerHTML = `
    <div class="post-body card-body px-4 py-2">
      <h3 class="post-title card-title">${context.post.author}</h3>
      <h6 class="card-subtitle mb-2 text-muted">${context.post.timestamp}</h6>
      <p class="card-text">${context.post.message}</p>
      <textarea class="card-text-editor form-control" style="display:none"></textarea>
    </div>
  `

    return post;
}

export function load_profile(contents) {
    const profile = document.createElement('div');
    profile.innerHTML = `
    <h1 id="profile-div-title">${contents.username}</h1>
    <span class="text-muted"><strong>Joined on ${contents.join_date}</strong>
    </span>
    <ul id="profile-stats-list">
      <li>
        <div>
          <h6>Posts</h6> ${contents.post_count}
        </div>
      </li>
      <li>
        <div>
          <h6>Following</h6>
          ${contents.following}
        </div>
      </li>
      <li>
        <div>
          <h6>Followers</h6> 
          ${contents.followed_by}
        </div>
      </li>
    </ul>
    
  `;

    // only add follow button user is signed in and is not the owner of the profile
    if (contents.requested_by && contents.requested_by !== contents.username) {
        const follow_btn = document.createElement('button');
        follow_btn.innerHTML = contents['is_followed'] ? 'Unfollow' : 'Follow';
        follow_btn.id = "follow-button";
        follow_btn.className = "button btn btn-primary";
        profile.appendChild(follow_btn);
    }

    return profile;
}
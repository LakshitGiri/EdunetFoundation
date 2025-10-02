import { auth, onAuthStateChanged, addComment, updateComment, deleteComment, getComments, ensureAnonymousUser } from "./backend.js";

const movieDetailContent = document.getElementById('movie-detail-content');
const backBtn = document.getElementById('back-btn');
const API_KEY = '8344505e30ec54ab2bea5e88c5311f6e';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let movieId = params.get('movie') || sessionStorage.getItem('lastMovieId');

  if (!movieId) {
    window.location.href = './index.html';
    return;
  }

  movieId = parseInt(movieId);
  sessionStorage.setItem('lastMovieId', movieId);

  if (!history.state || history.state.movieId !== movieId) {
    history.pushState({ type: 'detail', movieId }, '', `?movie=${movieId}`);
  }

  await showMovieInfo(movieId);
});

backBtn.addEventListener('click', () => window.history.back());

window.addEventListener('popstate', async (e) => {
  const state = e.state;
  if (state?.type === 'detail' && state.movieId) {
    await showMovieInfo(state.movieId);
  } else {
    window.location.href = './index.html';
  }
});

export async function showMovieInfo(movieId) {
  const DETAIL_URL = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`;
  try {
    const res = await fetch(DETAIL_URL);
    const movie = await res.json();

    const companies = movie.production_companies.map(c => c.name).join(', ');
    const countries = movie.production_countries.map(c => c.name).join(', ');
    const languages = movie.spoken_languages.map(l => l.english_name).join(', ');
    const revenue = movie.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    movieDetailContent.innerHTML = `
      <div class="movie-detail-card">
        <img class="movie-detail-poster" src="${IMG_BASE}w500${movie.poster_path}" alt="${movie.title}">
        <h1>${movie.title}</h1>
        <p><em>${movie.tagline || ''}</em></p>
        <div class="movie-meta-grid">
          <div class="meta-box"><strong>🗓️ Release:</strong> ${movie.release_date}</div>
          <div class="meta-box"><strong>⏱️ Runtime:</strong> ${movie.runtime} min</div>
          <div class="meta-box"><strong>🗣️ Language:</strong> ${languages}</div>
          <div class="meta-box"><strong>🌍 Country:</strong> ${countries}</div>
          <div class="meta-box"><strong>🏢 Companies:</strong> ${companies}</div>
          <div class="meta-box"><strong>⭐ Rating:</strong> ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count})</div>
          <div class="meta-box"><strong>💰 Revenue:</strong> ${revenue}</div>
          <div class="meta-box"><strong>🔥 Popularity:</strong> ${movie.popularity.toFixed(2)}</div>
          <div class="meta-box"><strong>📌 Status:</strong> ${movie.status}</div>
        </div>
        <p><strong>Overview:</strong> ${movie.overview}</p>
        <div id="comment-section"></div>
      </div>
    `;

    setupCommentSection(movieId);
  } catch (err) {
    console.error('Error loading movie details:', err);
  }
}

function setupCommentSection(movieId) {
  const section = document.getElementById('comment-section');
  if (!section) return;

  section.innerHTML = `
    <div class="comment-section">
      <h3>Comments</h3>
      <textarea id="comment-text" placeholder="Write your comment"></textarea>
      <div class="rating-stars">
        ${[1,2,3,4,5].map(n => `<span class="star" data-value="${n}">★</span>`).join('')}
      </div>
      <button class="submit-comment">Submit</button>
      <div class="comment-list"></div>
    </div>
  `;

  const commentText = section.querySelector('#comment-text');
  const commentList = section.querySelector('.comment-list');
  const stars = section.querySelectorAll('.star');
  const submitBtn = section.querySelector('.submit-comment');

  let selectedRating = 0;
  let editingId = null;

  const highlightStars = (rating) => {
    stars.forEach(star => star.classList.toggle('filled', parseInt(star.dataset.value) <= rating));
  };

  stars.forEach((star, index) => {
    const value = index + 1;
    star.addEventListener('mouseover', () => { if (!('ontouchstart' in window)) stars.forEach((s,i)=> s.classList.toggle('hovered', i<value)); });
    star.addEventListener('mouseout', () => { if (!('ontouchstart' in window)) stars.forEach(s=>s.classList.remove('hovered')); });
    star.addEventListener('click', () => { selectedRating = value; highlightStars(selectedRating); stars.forEach(s=>s.classList.remove('hovered')); });
  });

  async function renderComments() {
    const comments = await getComments(movieId);
    commentList.innerHTML = comments.length ? '' : "<p class='no-comments'>No comments yet. Be the first!</p>";
    comments.forEach(c => {
      const div = document.createElement('div');
      div.classList.add('comment-item');
      const isMine = auth.currentUser && c.userId === auth.currentUser.uid;
      div.innerHTML = `
        <div class="user-rating">${"★".repeat(c.rating)}${"☆".repeat(5-c.rating)}</div>
        <div class="comment-text">${c.text}</div>
        ${isMine ? `<div class="comment-actions">
          <button class="edit-btn" data-id="${c.id}">Edit</button>
          <button class="delete-btn" data-id="${c.id}">Delete</button>
        </div>` : ''}
      `;
      if(isMine){
        div.querySelector(".edit-btn").onclick = () => {
          commentText.value = c.text;
          selectedRating = c.rating;
          highlightStars(selectedRating);
          editingId = c.id;
          submitBtn.textContent = "Update";
        };
        div.querySelector(".delete-btn").onclick = async () => {
          if(confirm("Delete this comment?")){
            await deleteComment(c.id);
            renderComments();
          }
        };
      }
      commentList.appendChild(div);
    });
  }

  renderComments();
submitBtn.onclick = async () => {
  const text = commentText.value.trim();
  if (!text || selectedRating === 0) {
    return alert("Please write comment and select rating.");
  }

  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  submitBtn.textContent = editingId ? "Updating..." : "Submitting...";

  try {
    await ensureAnonymousUser();

    if (editingId) {
      await updateComment(editingId, text, selectedRating);
    } else {
      await addComment(movieId, text, selectedRating);
    }

    commentText.value = '';
    selectedRating = 0;
    editingId = null;
    highlightStars(0);
    submitBtn.textContent = "Submit";

    await renderComments();
  } catch (err) {
    console.error("Error submitting comment:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
  }
};

}

onAuthStateChanged(auth, ()=> {
  const lastMovieId = parseInt(sessionStorage.getItem('lastMovieId'));
  if(lastMovieId) setupCommentSection(lastMovieId);
});

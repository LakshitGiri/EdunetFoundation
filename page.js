import { auth, onAuthStateChanged, addComment, updateComment, deleteComment, getComments, ensureAnonymousUser } from "./backend.js";

const movieListView = document.getElementById('movie-list-view');
const movieDetailView = document.getElementById('movie-detail-view');
const API_KEY = '8344505e30ec54ab2bea5e88c5311f6e';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

export const showMovieInfo = async (movieId, goBackCallback) => {
  const DETAIL_URL = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`;

  try {
    const res = await fetch(DETAIL_URL);
    const movie = await res.json();

    const companies = movie.production_companies.map(c => c.name).join(', ');
    const countries = movie.production_countries.map(c => c.name).join(', ');
    const languages = movie.spoken_languages.map(l => l.english_name).join(', ');
    const revenue = movie.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    movieDetailView.innerHTML = `
      <div class="movie-detail-card">
        <button id="back-btn">← Back</button>
        <div class="movie-detail-content">
          <h1>${movie.title}</h1>
          <p><em>${movie.tagline || ''}</em></p>
          <img class="movie-detail-poster" src="${IMG_BASE}w500${movie.poster_path}" loading="lazy" alt="${movie.title}">
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
      </div>
    `;

    movieListView.style.display = 'none';
    movieDetailView.style.display = 'block';

    document.getElementById('back-btn').addEventListener('click', () => {
      movieDetailView.style.display = 'none';
      movieListView.style.display = 'grid';
      goBackCallback();
    });

    setupCommentSection(movieId);

  } catch (err) {
    console.error('Error loading movie details:', err);
  }
};

// Comment section remains unchanged (same as previous version)
function setupCommentSection(movieId) { 
  // ... existing comment code ...
}

// Re-render comments if auth changes
onAuthStateChanged(auth, ()=>{
  const lastMovieId = parseInt(localStorage.getItem('lastMovieId'));
  if(lastMovieId) setupCommentSection(lastMovieId);
});

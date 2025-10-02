const container = document.getElementById('movie-list-view');
const paginationWrapper = document.getElementById('pagination-wrapper');

const API_KEY = '8344505e30ec54ab2bea5e88c5311f6e';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

let currentPage = parseInt(sessionStorage.getItem('currentPage')) || 1;

async function renderMovies(page = 1) {
  const cached = sessionStorage.getItem(`popularMovies-page-${page}`);
  let movies;

  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.time < 10 * 60 * 1000) {
      movies = parsed.data;
    }
  }

  if (!movies) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`
    );
    const data = await res.json();
    movies = data.results;
    sessionStorage.setItem(
      `popularMovies-page-${page}`,
      JSON.stringify({ data: movies, time: Date.now() })
    );
  }

  currentPage = page;
  sessionStorage.setItem('currentPage', page);

  // Clear previous movies
  container.innerHTML = '';

  // Render movie cards
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_BASE}w300${movie.poster_path}" class="movie-img" alt="${movie.title}">
      <div class="movie-info">
        <h2 class="movie-title">${movie.title}</h2>
        <div class="movie-footer">
          <div class="rating-box">
            <div class="rating-label">TMDB:</div>
            <div class="movie-rating">${movie.vote_average.toFixed(1)}/10</div>
          </div>
          <button class="details-btn">See Details</button>
        </div>
      </div>
    `;
    card.querySelector('.details-btn').addEventListener('click', () => {
      sessionStorage.setItem('lastMovieId', movie.id);
      window.location.href = `./page.html?movie=${movie.id}`;
    });
    container.appendChild(card);
  });

  // Render pagination
  paginationWrapper.innerHTML = `
    <div class="pagination">
      <button id="prev-btn" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <button id="next-btn">Next</button>
    </div>
  `;

  document.getElementById('prev-btn').addEventListener('click', () => renderMovies(currentPage - 1));
  document.getElementById('next-btn').addEventListener('click', () => renderMovies(currentPage + 1));

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Restore page on back/forward
window.addEventListener('popstate', (e) => {
  const state = e.state;
  renderMovies(state?.page || parseInt(sessionStorage.getItem('currentPage')) || 1);
});

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get('page')) || currentPage;
  renderMovies(page);
});

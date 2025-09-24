import { showMovieInfo } from './page.js';

document.addEventListener('DOMContentLoaded', () => {
  const movieListView = document.getElementById('movie-list-view');
  const API_KEY = '8344505e30ec54ab2bea5e88c5311f6e';
  const IMG_BASE = 'https://image.tmdb.org/t/p/';
  let currentPage = parseInt(localStorage.getItem('currentPage')) || 1;
  let lastScrollPos = 0;

  // navigation stack
  let navStack = JSON.parse(sessionStorage.getItem('navStack')) || [];

  function pushStateToStack(state, replace = false) {
    if (!replace) {
      navStack.push(state);
      if (navStack.length > 10) navStack.shift();
    }
    sessionStorage.setItem('navStack', JSON.stringify(navStack));
    history[replace ? 'replaceState' : 'pushState'](state, '', '');
  }

  // 🔹 Card generator
  function generateMovieCards(movies) {
    movieListView.innerHTML = '';
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
              <div class="movie-rating">${movie.vote_average?.toFixed(1) || "N/A"}/10</div>
            </div>
            <button class="details-btn">More..</button>
          </div>
        </div>
      `;
      card.querySelector('.details-btn').addEventListener('click', () => {
        lastScrollPos = window.scrollY;
        pushStateToStack({ type: 'detail', movieId: movie.id, page: currentPage, scrollPos: lastScrollPos });
        showMovieInfo(movie.id, () => renderMovies(currentPage, lastScrollPos, false));
      });
      movieListView.appendChild(card);
    });
  }

  // 🔹 Render movies with pagination
  async function renderMovies(page = 1, scrollPos = 0, pushStack = true) {
    const cached = localStorage.getItem(`popularMovies-page-${page}`);
    let movies;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.time < 10 * 60 * 1000) movies = parsed.data;
    }
    if (!movies) {
      const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`);
      const data = await res.json();
      movies = data.results;
      localStorage.setItem(`popularMovies-page-${page}`, JSON.stringify({ data: movies, time: Date.now() }));
    }

    currentPage = page;
    localStorage.setItem('currentPage', page);

    generateMovieCards(movies);

    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    pagination.innerHTML = `
      <button id="prev-btn" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <button id="next-btn">Next</button>
    `;
    movieListView.appendChild(pagination);

    document.getElementById('prev-btn').addEventListener('click', () => {
      pushStateToStack({ type: 'list', page: currentPage - 1, scrollPos: 0 });
      renderMovies(currentPage - 1, 0, false);
    });
    document.getElementById('next-btn').addEventListener('click', () => {
      pushStateToStack({ type: 'list', page: currentPage + 1, scrollPos: 0 });
      renderMovies(currentPage + 1, 0, false);
    });

    window.scrollTo({ top: scrollPos, behavior: 'instant' });
    movieListView.style.display = 'grid';

    if (pushStack) pushStateToStack({ type: 'list', page: currentPage, scrollPos });
  }

  // 🔹 Handle back/forward gestures
  window.addEventListener('popstate', () => {
    navStack.pop();
    if (navStack.length === 0) {
      // No more steps, exit browser
      history.back();
      return;
    }
    const lastState = navStack[navStack.length - 1];
    if (lastState.type === 'detail') {
      showMovieInfo(lastState.movieId, () => renderMovies(lastState.page, lastState.scrollPos, false));
    } else if (lastState.type === 'list') {
      renderMovies(lastState.page, lastState.scrollPos, false);
    }
  });

  // 🔹 Initial load: home page
  pushStateToStack({ type: 'list', page: currentPage, scrollPos: 0 }, true);
  renderMovies(currentPage, 0, false);
});

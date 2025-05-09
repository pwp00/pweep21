document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.promo-carousel .carousel-slide');
    const slideInterval = 5000;
    let currentSlideIndex = 0;

    if (slides.length > 1) {
        function nextSlide() {
            slides[currentSlideIndex].classList.remove('active');
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            slides[currentSlideIndex].classList.add('active');
        }
        setInterval(nextSlide, slideInterval);
    } else if (slides.length === 1) {
        slides[0].classList.add('active');
    }

    const genreSelect = document.getElementById('genre-select');
    const negaraSelect = document.getElementById('negara-select');
    const movieGrid = document.querySelector('.content-grid');

    function filterMovies() {
        const movieCards = movieGrid ? movieGrid.querySelectorAll('.card-link') : [];
        if (!movieCards.length) return;
        const selectedGenre = genreSelect.value;
        const selectedNegara = negaraSelect.value;

        movieCards.forEach((card, index) => {
            const cardGenresString = card.dataset.genres || "";
            const cardCountry = card.dataset.country || "";
            const cardGenresArray = cardGenresString.split(' ');
            const genreMatch = !selectedGenre || cardGenresArray.includes(selectedGenre);
            const negaraMatch = !selectedNegara || cardCountry === selectedNegara;

            if (genreMatch && negaraMatch) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function createMovieCard(movie) {
        const link = document.createElement('a');
        link.href = `movie.html?id=${movie.id}`;
        link.target = "_blank";
        link.classList.add('card-link');
        link.dataset.genres = movie.genres.join(' ');
        link.dataset.country = movie.country;

        const card = document.createElement('div');
        card.classList.add('content-card');

        const img = document.createElement('img');
        img.src = movie.thumbnail;
        img.alt = `${movie.title} Thumbnail`;
        img.classList.add('card-image');

        const ratingBadge = document.createElement('div');
        ratingBadge.classList.add('rating-badge');
        const starIcon = document.createElement('span');
        starIcon.classList.add('star-icon');
        starIcon.textContent = '★';
        const ratingNumber = document.createElement('span');
        ratingNumber.classList.add('rating-number');
        ratingNumber.textContent = movie.rating;
        ratingBadge.appendChild(starIcon);
        ratingBadge.appendChild(ratingNumber);

        const info = document.createElement('div');
        info.classList.add('card-info');

        const title = document.createElement('p');
        title.classList.add('card-title');
        title.textContent = `${movie.title} (${movie.year})`;

        const meta = document.createElement('p');
        meta.classList.add('card-meta');
        const formattedGenres = movie.genres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ');
        meta.textContent = `${movie.type} | ${formattedGenres} | ${movie.country.toUpperCase()}`;

        info.appendChild(title);
        info.appendChild(meta);

        card.appendChild(img);
        card.appendChild(ratingBadge);
        card.appendChild(info);

        link.appendChild(card);

        return link;
    }

    const movieDetailContainer = document.querySelector('.movie-detail-content');

    if (movieDetailContainer) {
        const breadcrumbTitleElement = document.getElementById('breadcrumb-movie-title');
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        const videoPlayerContainer = document.getElementById('video-player-container');
        const titleElement = document.getElementById('movie-title');
        const genresElement = document.getElementById('movie-genres');
        const countryElement = document.getElementById('movie-country');
        const ratingElement = document.getElementById('movie-rating');
        const episodeContainer = document.getElementById('episode-buttons-container');

        if (movieId && videoPlayerContainer && titleElement && genresElement && countryElement && ratingElement && episodeContainer && breadcrumbTitleElement) {
            fetch('movies.json')
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(moviesData => {
                    const movie = moviesData.find(m => m.id === movieId);

                    if (movie) {
                        document.title = `${movie.title} (${movie.year}) - Detail Film`;
                        titleElement.textContent = `${movie.title} (${movie.year})`;
                        genresElement.textContent = movie.genres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ');
                        countryElement.textContent = movie.country.toUpperCase();
                        ratingElement.textContent = movie.rating;

                        if (breadcrumbTitleElement) {
                            breadcrumbTitleElement.textContent = `${movie.title} (${movie.year})`;
                        }

                        function loadVideo(videoUrl) {
                            const videoPlayerContainer = document.getElementById('video-player-container');
                            if (!videoPlayerContainer) return;

                            videoPlayerContainer.classList.remove('placeholder');
                            videoPlayerContainer.style.backgroundColor = '';
                            videoPlayerContainer.style.color = '';
                            videoPlayerContainer.style.display = '';
                            videoPlayerContainer.style.alignItems = '';
                            videoPlayerContainer.style.justifyContent = '';

                            let finalVideoUrl = videoUrl;

                            if (finalVideoUrl && finalVideoUrl.toLowerCase().includes('.m3u8')) {
                                if (Hls.isSupported()) {
                                    videoPlayerContainer.innerHTML = `<video id="hlsPlayer" controls autoplay width="100%" height="100%" style="display: block;"></video>`;
                                    const video = document.getElementById('hlsPlayer');
                                    const hls = new Hls({ startLevel: -1 });
                                    hls.loadSource(finalVideoUrl);
                                    hls.attachMedia(video);
                                    hls.on(Hls.Events.ERROR, function (event, data) {
                                        if (data.fatal) {
                                            switch(data.type) {
                                              case Hls.ErrorTypes.NETWORK_ERROR:
                                                videoPlayerContainer.innerHTML = `<p style="color:red;">Error Jaringan saat memuat video. (${data.details})</p>`;
                                                break;
                                              case Hls.ErrorTypes.MEDIA_ERROR:
                                                videoPlayerContainer.innerHTML = `<p style="color:red;">Error Media saat memutar video. (${data.details})</p>`;
                                                hls.recoverMediaError();
                                                break;
                                              default:
                                                videoPlayerContainer.innerHTML = `<p style="color:red;">Error tidak dikenal saat memuat video.</p>`;
                                                hls.destroy();
                                                break;
                                            }
                                        }
                                    });
                                } else if (document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
                                    videoPlayerContainer.innerHTML = `<video id="nativeHlsPlayer" src="${finalVideoUrl}" controls autoplay width="100%" height="100%" style="display: block;"></video>`;
                                    const video = document.getElementById('nativeHlsPlayer');
                                    video.addEventListener('error', function(e){
                                        videoPlayerContainer.innerHTML = `<p style="color:red;">Gagal memuat video dengan pemutar bawaan browser.</p>`;
                                    });
                                } else {
                                    videoPlayerContainer.innerHTML = '<p style="color:orange;">Browser Anda tidak mendukung pemutaran video HLS secara langsung.</p>';
                                    videoPlayerContainer.classList.add('placeholder');
                                }
                            } else if (videoUrl && (videoUrl.includes("youtube.com/embed") || videoUrl.includes("youtu.be"))) {
                                let embedUrl = videoUrl.replace("watch?v=", "embed/");
                                if (embedUrl.includes("youtu.be/")) {
                                    embedUrl = videoUrl.replace("youtu.be/", "youtube.com/embed/");
                                }
                                videoPlayerContainer.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" title="Video Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                            } else if (videoUrl && (videoUrl.toLowerCase().endsWith(".mp4") || videoUrl.toLowerCase().endsWith(".webm"))) {
                                let type = videoUrl.toLowerCase().endsWith(".mp4") ? "video/mp4" : "video/webm";
                                videoPlayerContainer.innerHTML = `<video controls autoplay width="100%" height="100%" style="display: block;"><source src="${videoUrl}" type="${type}">Browser Anda tidak mendukung tag video.</video>`;
                            } else {
                                videoPlayerContainer.innerHTML = 'Format video tidak didukung atau URL tidak valid.';
                                videoPlayerContainer.classList.add('placeholder');
                                videoPlayerContainer.style.backgroundColor = '#444';
                                videoPlayerContainer.style.color = '#fff';
                            }
                        }

                        episodeContainer.innerHTML = '';

                        if (movie.type === "Serial" && Array.isArray(movie.videoLink) && movie.videoLink.length > 0) {
                            episodeContainer.style.display = 'flex';

                            function setActiveButton(index) {
                                episodeContainer.querySelectorAll('.episode-button').forEach((btn, i) => {
                                    if (i === index) {
                                        btn.classList.add('active');
                                    } else {
                                        btn.classList.remove('active');
                                    }
                                });
                            }

                            movie.videoLink.forEach((episodeLink, index) => {
                                const button = document.createElement('button');
                                button.textContent = index + 1;
                                button.classList.add('episode-button');
                                button.dataset.index = index;

                                button.addEventListener('click', () => {
                                    loadVideo(episodeLink);
                                    setActiveButton(index);
                                });
                                episodeContainer.appendChild(button);
                            });

                            if (movie.videoLink.length > 0) {
                                loadVideo(movie.videoLink[0]);
                                setActiveButton(0);
                            }
                        } else if (movie.type === "Movie" && typeof movie.videoLink === 'string') {
                            episodeContainer.style.display = 'none';
                            loadVideo(movie.videoLink);
                        } else {
                            episodeContainer.style.display = 'none';
                            videoPlayerContainer.textContent = 'Data video tidak tersedia atau format tidak valid.';
                            videoPlayerContainer.classList.add('placeholder');
                        }
                    } else {
                        movieDetailContainer.innerHTML = '<p style="color: red; text-align: center;">Film tidak ditemukan.</p>';
                        document.title = "Film Tidak Ditemukan";
                        if (breadcrumbTitleElement) {
                            breadcrumbTitleElement.textContent = "Film Tidak Ditemukan";
                        }
                    }
                })
                .catch(error => {
                    if(movieDetailContainer) {
                        movieDetailContainer.innerHTML = '<p style="color: red; text-align: center;">Gagal memuat detail film.</p>';
                    }
                    document.title = "Error Memuat Film";
                    if (breadcrumbTitleElement) {
                        breadcrumbTitleElement.textContent = "Error";
                    }
                });
        } else if (!movieId && movieDetailContainer && breadcrumbTitleElement) {
             movieDetailContainer.innerHTML = '<p style="color: orange; text-align: center;">ID Film tidak ditemukan di URL.</p>';
             document.title = "ID Film Hilang";
             breadcrumbTitleElement.textContent = "ID Tidak Valid";
            if (breadcrumbTitleElement) { // Pastikan cek sebelum set
                breadcrumbTitleElement.textContent = "ID Tidak Valid";
             }
            } else if (!breadcrumbTitleElement && movieDetailContainer) { // Jika elemen breadcrumb tidak ada di halaman detail
                console.warn("Elemen #breadcrumb-movie-title tidak ditemukan di movie.html");
            }
    } else {
        const mainPageGrid = document.querySelector('.content-grid');
        if (mainPageGrid) {
             loadMovies();
        }
    }

    function loadMovies() {
        fetch('movies.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(moviesData => {
                if (!movieGrid) {
                    return;
                }
                movieGrid.innerHTML = '';
                moviesData.forEach(movie => {
                    const movieCardElement = createMovieCard(movie);
                    movieGrid.appendChild(movieCardElement);
                });
                filterMovies();
            })
            .catch(error => {
                if (movieGrid) {
                    movieGrid.innerHTML = '<p style="color: red; text-align: center;">Gagal memuat daftar film.</p>';
                }
            });
    }

    const carouselContainer = document.querySelector('.promo-carousel.large');
    if (carouselContainer) {
        carouselContainer.addEventListener('click', () => {
            const activeSlide = carouselContainer.querySelector('.carousel-slide.active');
            if (activeSlide) {
                const targetUrl = activeSlide.dataset.targetUrl;
                if (targetUrl) {
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }
            }
        });
    }

    if (genreSelect) {
        genreSelect.addEventListener('change', filterMovies);
    }
    if (negaraSelect) {
        negaraSelect.addEventListener('change', filterMovies);
    }
});

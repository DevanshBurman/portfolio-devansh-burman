const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const loadingScreen = document.querySelector('.loading-screen');
const progressBar = document.querySelector('.scroll-progress span');
const siteHeader = document.querySelector('.site-header');
const backToTop = document.querySelector('.back-to-top');
const resumeModal = document.querySelector('.resume-modal');
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const darkSpotlight = document.querySelector('.dark-spotlight');
const heroCopy = document.querySelector('.hero-copy');

const savedTheme = localStorage.getItem('portfolio-theme');
const requestedTheme = new URLSearchParams(location.search).get('theme');
const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (requestedTheme === 'light' || requestedTheme === 'dark') root.dataset.theme = requestedTheme;
else if (savedTheme === 'dark' || (!savedTheme && preferredDark)) root.dataset.theme = 'dark';

function updateThemeButton() {
  const isDark = root.dataset.theme === 'dark';
  const span = themeButton.querySelector('span');
  themeButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  themeButton.setAttribute('aria-pressed', String(isDark));
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#0A0C0B' : '#faf9f5';
  
  themeButton.classList.add('animating');
  setTimeout(() => {
    span.textContent = isDark ? '☾' : '☼';
    themeButton.classList.remove('animating');
  }, 150);
}

updateThemeButton();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('portfolio-theme', root.dataset.theme);
  updateThemeButton();
});

window.addEventListener('load', () => {
  window.setTimeout(() => loadingScreen.classList.add('loaded'), 250);
});

menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', isOpen);
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});

// Staggered reveal observer
const observer = new IntersectionObserver((entries) => {
  let staggerIndex = 0;
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const animateType = el.getAttribute('data-animate');
      if (animateType === 'stagger') {
        el.style.transitionDelay = `${staggerIndex * 0.15}s`;
        staggerIndex++;
      } else if (animateType === 'scale-fade') {
        el.style.transitionDelay = `${staggerIndex * 0.1}s`;
        staggerIndex++;
      }
      
      // small timeout to allow CSS to register the delay
      setTimeout(() => el.classList.add('visible'), 50);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

function revealVisibleElements() {
  let staggerIndex = 0;
  document.querySelectorAll('.reveal:not(.visible)').forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      const animateType = element.getAttribute('data-animate');
      if (animateType === 'stagger' || animateType === 'scale-fade') {
        element.style.transitionDelay = `${staggerIndex * 0.1}s`;
        staggerIndex++;
      }
      element.classList.add('visible');
      observer.unobserve(element);
    }
  });
}

requestAnimationFrame(revealVisibleElements);
window.setTimeout(revealVisibleElements, 350);
window.addEventListener('hashchange', () => window.setTimeout(revealVisibleElements, 120));

// Hero Word Animation Timeline
window.addEventListener('load', () => {
  const words = document.querySelectorAll('.hero h1 .word');
  words.forEach((word, idx) => {
    setTimeout(() => {
      word.classList.add('visible');
    }, 400 + (idx * 120));
  });
});

const navLinks = [...nav.querySelectorAll('a[href^="#"]')].filter(link => link.hash && link.hash !== '#contact');
const pageSections = navLinks
  .map(link => document.querySelector(link.hash))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const isCurrent = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

pageSections.forEach(section => sectionObserver.observe(section));

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 900;
    const start = performance.now();

    function animate(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    counterObserver.unobserve(element);
  });
}, { threshold: .6 });
counters.forEach(counter => counterObserver.observe(counter));

const projectFilters = document.querySelectorAll('.project-filter');
const projectCards = document.querySelectorAll('.project-card[data-category]');
projectFilters.forEach(button => {
  button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    projectFilters.forEach(filterButton => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('active', isActive);
      filterButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    projectCards.forEach(card => {
      const categories = card.dataset.category.split(' ');
      const isVisible = filter === 'all' || categories.includes(filter);
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) requestAnimationFrame(() => card.classList.add('visible'));
    });
  });
});

let previousScroll = window.scrollY;
let ticking = false;
function updateScrollUI() {
  const currentScroll = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${maxScroll > 0 ? (currentScroll / maxScroll) * 100 : 0}%`;
  backToTop.classList.toggle('visible', currentScroll > 650);

  if (currentScroll > previousScroll && currentScroll > 180) siteHeader.classList.add('header-hidden');
  else siteHeader.classList.remove('header-hidden');
  previousScroll = currentScroll;

  // Hero Parallax Effect
  if (currentScroll < window.innerHeight) {
    if (heroCopy) heroCopy.style.transform = `translateY(${currentScroll * 0.15}px)`;
  }
  
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollUI);
    ticking = true;
  }
}, { passive: true });

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.querySelectorAll('.resume-preview-button').forEach(button => {
  button.addEventListener('click', () => resumeModal.showModal());
});
document.querySelectorAll('.modal-close').forEach(button => {
  button.addEventListener('click', () => resumeModal.close());
});
resumeModal.addEventListener('click', event => {
  if (event.target === resumeModal) resumeModal.close();
});

document.querySelectorAll('.docs-button').forEach(button => {
  button.addEventListener('click', () => {
    const original = button.textContent;
    button.textContent = 'Documentation coming soon';
    window.setTimeout(() => { button.textContent = original; }, 1800);
  });
});

const copyButton = document.querySelector('.copy-email');
if (copyButton?.dataset.email) {
  copyButton.disabled = false;
  copyButton.addEventListener('click', async () => {
    await navigator.clipboard.writeText(copyButton.dataset.email);
    copyButton.textContent = 'Copied';
    window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 1600);
  });
}

if (window.matchMedia('(pointer: fine)').matches) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('pointermove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
    if (darkSpotlight && root.dataset.theme === 'dark') {
      darkSpotlight.style.left = `${mouseX}px`;
      darkSpotlight.style.top = `${mouseY}px`;
    }
  }, { passive: true });

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.2; // Lerp
    ringY += (mouseY - ringY) * 0.2;
    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }
    requestAnimationFrame(renderCursor);
  };
  requestAnimationFrame(renderCursor);

  // Magnetic hover effect
  const interactiveElements = document.querySelectorAll('a, button, .project-card, .tilt-card');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if(cursorRing) cursorRing.classList.add('magnetic');
    });
    el.addEventListener('mouseleave', () => {
      if(cursorRing) cursorRing.classList.remove('magnetic');
    });
  });

  // 3D Tilt Effect
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg
      const rotateY = ((x - centerX) / centerX) * 6;
      
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}

// --- Certifications & Credentials Logic ---
const certificationsData = [
  {
    id: 1,
    category: 'academic',
    categoryLabel: 'ACADEMIC CERTIFICATION',
    title: 'Foundation Level Certificate',
    issuer: 'IIT Madras BS Degree',
    logoUrl: 'https://cdn.corenexis.com/f/deyzR38EYd6.png',
    status: 'Verified',
    description: 'Successfully completed the Foundation Level of the IIT Madras BS Degree in Data Science and Applications covering Computational Thinking, Mathematics, Statistics, Python Programming, English, and foundational data science concepts.',
    badge: 'Verified Academic Credential',
    credentialLink: 'https://cdn.imageurlgenerator.com/uploads/dd66ebc3-790d-4442-9d18-c2d56351b59e.pdf',
    issueDate: '30th April 2025',
    credentialId: '24F2006090'
  },
  {
    id: 2,
    category: 'academic',
    categoryLabel: 'ACADEMIC CERTIFICATION',
    title: 'Advanced Certificate Programming & Application Development',
    issuer: 'IIT Madras BS Degree',
    logoUrl: 'https://cdn.corenexis.com/f/deyzR38EYd6.png',
    status: 'Verified',
    description: 'Successfully completed the Advanced Certificate in Programming and Application Development with coursework in Software Engineering, Database Systems, Web Technologies, Application Development, and Programming.',
    badge: 'Advanced Credential',
    credentialLink: 'https://cdn.imageurlgenerator.com/uploads/d996aef9-98c5-4206-ae28-8051d538a4de.pdf',
    issueDate: 'Upcoming',
    credentialId: ''
  },
  {
    id: 3,
    category: 'nptel',
    categoryLabel: 'NPTEL CERTIFICATION',
    title: 'Programming, Data Structures and Algorithms using Python',
    issuer: 'NPTEL',
    logoUrl: 'https://cdn.corenexis.com/f/FHS6Tg922q2.jpeg',
    status: 'Verified',
    description: 'Completed an NPTEL certification focused on Python programming, object-oriented programming, data structures, algorithm design, recursion, searching, sorting, and problem solving.',
    badge: 'Elite Certification',
    credentialLink: 'https://nptel.ac.in/noc/E_Certificate/NPTEL26CS79S35750040603184366',
    issueDate: 'Jan-Mar 2026',
    credentialId: 'NPTEL26CS79S357500406'
  },
  {
    id: 4,
    category: 'nptel',
    categoryLabel: 'NPTEL CERTIFICATION',
    title: 'Introduction to Machine Learning',
    issuer: 'NPTEL',
    logoUrl: 'https://cdn.corenexis.com/f/FHS6Tg922q2.jpeg',
    status: 'Verified',
    description: 'Successfully completed certification covering supervised learning, regression, classification, model evaluation, feature engineering, and machine learning fundamentals.',
    badge: 'Machine Learning',
    credentialLink: 'https://cdn.imageurlgenerator.com/uploads/c89dda33-5863-4956-825c-fb3ba2c79735.pdf',
    issueDate: 'Jan-Apr 2026',
    credentialId: 'NPTEL26CS74S256401347'
  },
  {
    id: 5,
    category: 'hackathon',
    categoryLabel: 'HACKATHON ACHIEVEMENT',
    title: 'Runner-up (2nd Place)',
    issuer: 'Pre-Hackathon (RPA Based)',
    logoUrl: 'https://cdn.corenexis.com/f/RaKdcW4jJw5.png',
    status: 'Achievement',
    description: 'Secured Second Place by developing an innovative Robotic Process Automation (RPA) based software solution under competitive hackathon conditions while collaborating in a multidisciplinary team.',
    badge: '🏆 Runner-up',
    credentialLink: 'https://cdn.imageurlgenerator.com/uploads/164985f5-8a3d-4f2a-baf5-cb469992d435.pdf',
    featured: true
  },
  {
    id: 6,
    category: 'professional',
    categoryLabel: 'PROFESSIONAL LEARNING',
    title: 'Infosys Springboard',
    issuer: 'Infosys',
    logoUrl: 'https://cdn.corenexis.com/f/W8lXZ2siYzf.png',
    status: 'Completed',
    description: 'Completed multiple professional certifications covering Software Development, Artificial Intelligence, Cloud Computing, Programming, Career Development, and Emerging Technologies.',
    badge: 'Continuous Learning',
    credentialLink: '',
    displayOverride: '5+ Certifications Completed'
  }
];

let certTooltip;
function getCertTooltip() {
  if (!certTooltip) {
    certTooltip = document.createElement('div');
    certTooltip.className = 'cert-preview-tooltip';
    document.body.appendChild(certTooltip);
  }
  return certTooltip;
}

function showCertTooltip(cert) {
  const tooltip = getCertTooltip();
  tooltip.innerHTML = `
    ${cert.logoUrl ? `<div class="tooltip-logo"><img src="${cert.logoUrl}" alt="${cert.issuer}"></div>` : ''}
    <div class="tooltip-content">
      <h4>${cert.title}</h4>
      ${cert.issueDate ? `<span>Issued: ${cert.issueDate}</span>` : ''}
      ${cert.credentialId ? `<span>ID: ${cert.credentialId}</span>` : ''}
      <strong>Click to View Certificate ↗</strong>
    </div>
  `;
  tooltip.classList.add('visible');
}

function moveCertTooltip(e) {
  const tooltip = getCertTooltip();
  tooltip.style.left = `${e.clientX + 15}px`;
  tooltip.style.top = `${e.clientY + 15}px`;
}

function hideCertTooltip() {
  const tooltip = getCertTooltip();
  if (tooltip) tooltip.classList.remove('visible');
}

function renderCertifications(filter = 'all', searchQuery = '') {
  const certContainer = document.getElementById('certification-cards-container');
  if (!certContainer) return;
  
  certContainer.innerHTML = '';
  
  let filteredData = certificationsData;
  if (filter !== 'all') {
    filteredData = filteredData.filter(cert => cert.category === filter);
  }
  
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(cert => 
      cert.title.toLowerCase().includes(query) || 
      cert.description.toLowerCase().includes(query) ||
      cert.issuer.toLowerCase().includes(query)
    );
  }
  
  filteredData.forEach((cert, index) => {
    const card = document.createElement('article');
    card.className = 'cert-card reveal visible' + (cert.featured ? ' featured-cert' : '');
    card.style.transitionDelay = `${index * 0.1}s`;
    
    let logoHtml = '<div class="issuer-logo-placeholder"></div>';
    if (cert.logoUrl) {
      logoHtml = `<img src="${cert.logoUrl}" alt="${cert.issuer} logo" class="institution-logo" loading="lazy">`;
    }
    
    const verifyButton = cert.credentialLink && cert.credentialLink !== '#' 
      ? '<span class="verify-btn">View Credential &rarr;</span>' 
      : '';
    const displayOverride = cert.displayOverride ? `<div class="cert-display-override">${cert.displayOverride}</div>` : '';
    
    const innerHtml = `
      <div class="cert-header">
        <div class="cert-category">${cert.categoryLabel}</div>
        <div class="cert-number">0${index + 1}</div>
      </div>
      <div class="cert-body">
        <h3 class="cert-title">${cert.title}</h3>
        <div class="cert-issuer">
          ${logoHtml}
          <div class="issuer-text">
            <span class="issuer-name">${cert.issuer}</span>
            <span class="cert-status${cert.status === 'Verified' ? ' status-verified' : ''}">
              ${cert.status === 'Verified' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
              ${cert.status}
            </span>
          </div>
        </div>
        <p class="cert-description">${cert.description}</p>
        ${displayOverride}
      </div>
      <div class="cert-footer">
        <div class="cert-badge${cert.featured ? ' badge-gold' : ''}">${cert.badge}</div>
        ${verifyButton}
      </div>
    `;
    
    if (cert.credentialLink && cert.credentialLink !== '#') {
      const linkWrapper = document.createElement('a');
      linkWrapper.href = cert.credentialLink;
      linkWrapper.target = '_blank';
      linkWrapper.rel = 'noopener noreferrer';
      linkWrapper.className = 'cert-link-wrapper';
      linkWrapper.innerHTML = innerHtml;
      card.appendChild(linkWrapper);
      
      if (window.matchMedia('(pointer: fine)').matches) {
        card.addEventListener('mouseenter', () => showCertTooltip(cert));
        card.addEventListener('mousemove', moveCertTooltip);
        card.addEventListener('mouseleave', hideCertTooltip);
      }
    } else {
      card.innerHTML = innerHtml;
    }
    
    certContainer.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const filterChips = document.querySelectorAll('.filter-chip');
  const certSearch = document.getElementById('cert-search');

  if (filterChips.length > 0) {
    filterChips.forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip.classList.contains('active')));
      chip.addEventListener('click', (e) => {
        filterChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        e.target.classList.add('active');
        e.target.setAttribute('aria-pressed', 'true');
        renderCertifications(e.target.dataset.filter, certSearch ? certSearch.value : '');
      });
    });
  }

  if (certSearch) {
    certSearch.addEventListener('input', (e) => {
      const activeFilter = document.querySelector('.filter-chip.active');
      const filterValue = activeFilter ? activeFilter.dataset.filter : 'all';
      renderCertifications(filterValue, e.target.value);
    });
  }
  
  // Also render if the container exists but DOMContentLoaded already fired
  renderCertifications();
});
// Execute it once in case script runs after DOMContentLoaded
renderCertifications();

// --- Live GitHub dashboard ---
const githubRoot = document.querySelector('[data-github-root]');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formatNumber = value => value == null ? 'N/A' : new Intl.NumberFormat().format(value);
const formatDate = date => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

function animateMetric(element, value) {
  if (value == null || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = formatNumber(value);
    return;
  }
  const start = performance.now();
  const tick = now => {
    const progress = Math.min((now - start) / 750, 1);
    element.textContent = formatNumber(Math.round(value * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function repoCard(repo, featured = false) {
  const topics = (repo.topics || []).slice(0, 4);
  return `<article class="${featured ? 'featured-repo-card' : 'repo-card'}">
    <div class="repo-card-head"><span>${escapeHtml(repo.visibility || 'public')}</span><span>Updated ${formatDate(repo.updated_at)}</span></div>
    <h4>${escapeHtml(repo.name.replaceAll('-', ' '))}</h4>
    <p>${escapeHtml(repo.description || 'A public GitHub repository by Devansh Burman.')}</p>
    ${topics.length ? `<div class="repo-card-topics">${topics.map(topic => `<span>${escapeHtml(topic)}</span>`).join('')}</div>` : ''}
    <div class="repo-card-footer"><span>${escapeHtml(repo.language || 'Code')}</span><span aria-label="${repo.stargazers_count} stars">★ ${repo.stargazers_count}</span><span aria-label="${repo.forks_count} forks">⑂ ${repo.forks_count}</span>
    <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(repo.name)} repository in a new tab">GitHub ↗</a></div>
  </article>`;
}

function eventDescription(event) {
  const repo = escapeHtml(event.repo?.name?.split('/').pop() || 'repository');
  const labels = {
    CreateEvent: `Created ${repo}`,
    PushEvent: `Pushed ${event.payload?.size || ''} commit${event.payload?.size === 1 ? '' : 's'} to ${repo}`,
    PullRequestEvent: `${event.payload?.action === 'opened' ? 'Opened' : 'Updated'} a pull request in ${repo}`,
    ReleaseEvent: `Published a release in ${repo}`,
    IssuesEvent: `${event.payload?.action || 'Updated'} an issue in ${repo}`,
    WatchEvent: `Starred ${repo}`,
    ForkEvent: `Forked ${repo}`
  };
  return labels[event.type] || `Updated ${repo}`;
}

function renderGitHub(data) {
  const metricLabels = [
    ['repositories', 'Repositories'], ['followers', 'Followers'], ['following', 'Following'],
    ['stars', 'Stars earned'], ['forks', 'Total forks'], ['commits', 'Public commits'], ['contributions', 'Contributions']
  ];
  const metrics = githubRoot.querySelector('[data-github-metrics]');
  metrics.innerHTML = metricLabels.map(([key, label]) => `<div class="github-metric"><strong data-value="${data.stats[key] ?? ''}">0</strong><span>${label}</span></div>`).join('');
  metrics.querySelectorAll('strong').forEach((element, index) => animateMetric(element, data.stats[metricLabels[index][0]]));

  githubRoot.querySelector('[data-featured-repos]').innerHTML = data.featured.map(repo => repoCard(repo, true)).join('');
  githubRoot.querySelector('[data-latest-repos]').innerHTML = data.latest.map(repo => repoCard(repo)).join('');
  githubRoot.querySelector('[data-featured-panel]').hidden = !data.featured.length;
  githubRoot.querySelector('[data-repos-panel]').hidden = !data.latest.length;

  if (data.contributions?.days?.length) {
    const days = data.contributions.days;
    const map = githubRoot.querySelector('[data-contribution-map]');
    map.innerHTML = days.map(day => `<i data-level="${Math.min(Number(day.level || 0), 4)}" title="${escapeHtml(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}"></i>`).join('');
    map.setAttribute('aria-label', `${formatNumber(data.contributions.total)} contributions in the last year`);
    githubRoot.querySelector('[data-contribution-total]').textContent = `${formatNumber(data.contributions.total)} in the last year`;
    githubRoot.querySelector('[data-contributions-panel]').hidden = false;
  }

  const languageEntries = Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const totalBytes = languageEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (totalBytes) {
    githubRoot.querySelector('[data-language-chart]').innerHTML = languageEntries.map(([language, bytes]) => {
      const percent = (bytes / totalBytes) * 100;
      return `<div class="language-row"><div><span>${escapeHtml(language)}</span><strong>${percent.toFixed(1)}%</strong></div><progress max="100" value="${percent}" aria-label="${escapeHtml(language)} ${percent.toFixed(1)} percent"></progress></div>`;
    }).join('');
    githubRoot.querySelector('[data-languages-panel]').hidden = false;
  }

  if (data.events.length) {
    githubRoot.querySelector('[data-activity-feed]').innerHTML = data.events.slice(0, 5).map(event =>
      `<li><span></span><div><strong>${eventDescription(event)}</strong><time datetime="${escapeHtml(event.created_at)}">${formatDate(event.created_at)}</time></div></li>`
    ).join('');
    githubRoot.querySelector('[data-activity-panel]').hidden = false;
  }

  const topics = [...new Set(data.repos.flatMap(repo => repo.topics || []))].slice(0, 12);
  githubRoot.querySelector('[data-repo-topics]').innerHTML = topics.map(topic => `<span>${escapeHtml(topic)}</span>`).join('');
  githubRoot.querySelector('[data-github-status]').textContent = data.cached ? 'Live GitHub data · cached for speed' : 'Live from GitHub · updated just now';
  githubRoot.setAttribute('aria-busy', 'false');
}

async function loadGitHub(force = false) {
  const error = githubRoot.querySelector('[data-github-error]');
  const retry = githubRoot.querySelector('[data-github-retry]');
  error.hidden = true;
  retry.hidden = true;
  try { renderGitHub(await globalThis.githubService.getGitHubDashboard({ force })); }
  catch (requestError) {
    githubRoot.setAttribute('aria-busy', 'false');
    githubRoot.querySelector('[data-github-status]').textContent = 'GitHub data is temporarily unavailable';
    error.textContent = requestError.message || 'Unable to load GitHub data right now.';
    error.hidden = false;
    retry.hidden = false;
  }
}

if (githubRoot) {
  const githubSection = document.querySelector('#github');
  const githubObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadGitHub();
      githubObserver.disconnect();
    }
  }, { rootMargin: '300px 0px' });
  githubObserver.observe(githubSection);
  githubRoot.querySelector('[data-github-retry]').addEventListener('click', () => loadGitHub(true));
}

// --- Social Links Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  if (typeof SOCIAL_LINKS === 'undefined') {
    console.warn('SOCIAL_LINKS config not found. Please ensure config/socials.js is loaded.');
    return;
  }
  
  const socialElements = document.querySelectorAll('[data-social]');
  socialElements.forEach(el => {
    const platform = el.getAttribute('data-social');
    if (SOCIAL_LINKS[platform]) {
      el.href = SOCIAL_LINKS[platform];
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
  });

  // Github placeholder alert for projects
  document.querySelectorAll('a[href="#"]').forEach(link => {
    if (link.textContent.includes('GitHub')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        alert('GitHub repo will soon be added!');
      });
    }
  });
});

// Optimize animation frame handling

// Minor performance tweaks

(function(){
  "use strict";

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', function(){
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Highlight the current page in nav ----------
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(function(link){
    const href = link.getAttribute('href');
    if(href === currentPage || (currentPage === '' && href === 'index.html')){
      link.classList.add('active');
    }
  });

  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  // ---------- Contact form (sends to backend, saved in messages.json) ----------
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      const note = document.getElementById('formNote');
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if(!name || !email || !message){
        note.textContent = 'Please fill in your name, email, and message.';
        return;
      }

      submitBtn.disabled = true;
      note.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message })
      })
        .then(function(res){
          return res.json().then(function(data){ return { ok: res.ok, data: data }; });
        })
        .then(function(result){
          if(result.ok){
            note.textContent = 'Thank you, ' + name + ' — your message has been sent. I\'ll get back to you soon.';
            contactForm.reset();
          } else {
            note.textContent = result.data.error || 'Something went wrong. Please try again.';
          }
        })
        .catch(function(){
          note.textContent = 'Network error — please check your connection and try again.';
        })
        .finally(function(){
          submitBtn.disabled = false;
        });
    });
  }

  // ---------- Profile: load + edit (about.html) ----------
  const profileFields = {
    name: document.getElementById('profileName'),
    title: document.getElementById('profileTitle'),
    bio1: document.getElementById('profileBio1'),
    bio2: document.getElementById('profileBio2'),
    quote: document.getElementById('profileQuote'),
    location: document.getElementById('profileLocation'),
    graduating: document.getElementById('profileGraduating'),
    currentlyLearning: document.getElementById('profileLearning'),
    openTo: document.getElementById('profileOpenTo')
  };
  const editForm = document.getElementById('editProfileForm');
  const toggleEditBtn = document.getElementById('toggleEditBtn');
  const navLogo = document.querySelector('.logo');

  function updateNavLogo(fullName){
    if(!navLogo || !fullName) return;
    const parts = fullName.trim().split(' ');
    const first = parts.shift() || '';
    const rest = parts.join(' ');
    navLogo.textContent = '';
    navLogo.appendChild(document.createTextNode(first + ' '));
    const span = document.createElement('span');
    span.textContent = rest;
    navLogo.appendChild(span);
  }

  function renderProfile(profile){
    if(profileFields.name) profileFields.name.textContent = profile.name;
    if(profileFields.title) profileFields.title.textContent = profile.title;
    if(profileFields.bio1) profileFields.bio1.textContent = profile.bio1;
    if(profileFields.bio2) profileFields.bio2.textContent = profile.bio2;
    if(profileFields.quote) profileFields.quote.textContent = profile.quote;
    if(profileFields.location) profileFields.location.textContent = profile.location;
    if(profileFields.graduating) profileFields.graduating.textContent = profile.graduating;
    if(profileFields.currentlyLearning) profileFields.currentlyLearning.textContent = profile.currentlyLearning;
    if(profileFields.openTo) profileFields.openTo.textContent = profile.openTo;
    updateNavLogo(profile.name);

    if(editForm){
      editForm.name.value = profile.name || '';
      editForm.title.value = profile.title || '';
      editForm.bio1.value = profile.bio1 || '';
      editForm.bio2.value = profile.bio2 || '';
      editForm.quote.value = profile.quote || '';
      editForm.location.value = profile.location || '';
      editForm.graduating.value = profile.graduating || '';
      editForm.currentlyLearning.value = profile.currentlyLearning || '';
      editForm.openTo.value = profile.openTo || '';
    }
  }

  // Always fetch the profile (even on pages without the edit form) so the
  // nav logo stays in sync with the saved name across the whole site.
  fetch('/api/profile')
    .then(function(res){ return res.json(); })
    .then(renderProfile)
    .catch(function(){ /* keep static fallback text already in the HTML */ });

  if(toggleEditBtn && editForm){
    toggleEditBtn.addEventListener('click', function(){
      const isHidden = editForm.hasAttribute('hidden');
      if(isHidden){
        editForm.removeAttribute('hidden');
        toggleEditBtn.textContent = 'Cancel';
      } else {
        editForm.setAttribute('hidden', '');
        toggleEditBtn.textContent = 'Edit Profile';
      }
    });
  }

  if(editForm){
    editForm.addEventListener('submit', function(e){
      e.preventDefault();
      const note = document.getElementById('editProfileNote');
      const submitBtn = editForm.querySelector('button[type="submit"]');
      const payload = {
        name: editForm.name.value.trim(),
        title: editForm.title.value.trim(),
        bio1: editForm.bio1.value.trim(),
        bio2: editForm.bio2.value.trim(),
        quote: editForm.quote.value.trim(),
        location: editForm.location.value.trim(),
        graduating: editForm.graduating.value.trim(),
        currentlyLearning: editForm.currentlyLearning.value.trim(),
        openTo: editForm.openTo.value.trim()
      };

      submitBtn.disabled = true;
      note.textContent = 'Saving…';

      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function(res){
          return res.json().then(function(data){ return { ok: res.ok, data: data }; });
        })
        .then(function(result){
          if(result.ok){
            renderProfile(result.data.profile);
            note.textContent = 'Profile updated successfully.';
            if(toggleEditBtn){
              editForm.setAttribute('hidden', '');
              toggleEditBtn.textContent = 'Edit Profile';
            }
          } else {
            note.textContent = result.data.error || 'Could not update profile.';
          }
        })
        .catch(function(){
          note.textContent = 'Network error — please try again.';
        })
        .finally(function(){
          submitBtn.disabled = false;
        });
    });
  }

})();
/* ===== Tab Switching ===== */
const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    // Quitar clase activa de todas las pestañas
    tabs.forEach((t) => t.classList.remove('active'));
    // Activar la pestaña seleccionada
    tab.classList.add('active');

    // Mostrar/ocultar formularios
    const target = tab.getAttribute('data-tab');
    if (target === 'login') {
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    } else {
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
    }
  });
});

/* ===== Login ===== */
formLogin.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    alert('Por favor completa todos los campos.');
    return;
  }

  // Buscar usuario en localStorage
  const users = JSON.parse(localStorage.getItem('snapcopy_users') || '[]');
  const user = users.find(
    (u) => u.email === email.toLowerCase() && u.password === password
  );

  if (!user) {
    alert('Email o contraseña incorrectos.');
    return;
  }

  // Guardar sesión
  localStorage.setItem(
    'snapcopy_session',
    JSON.stringify({ email: user.email, name: user.name })
  );

  alert('¡Bienvenido, ' + user.name + '!');
  // Aquí puedes redirigir: window.location.href = '/dashboard';
});

/* ===== Registro ===== */
formRegister.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const confirm = document.getElementById('register-confirm').value.trim();

  if (!name || !email || !password || !confirm) {
    alert('Por favor completa todos los campos.');
    return;
  }

  if (password !== confirm) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('snapcopy_users') || '[]');
  const exists = users.find((u) => u.email === email.toLowerCase());

  if (exists) {
    alert('Ya existe una cuenta con ese email.');
    return;
  }

  // Crear usuario
  const newUser = {
    name: name,
    email: email.toLowerCase(),
    password: password,
  };

  users.push(newUser);
  localStorage.setItem('snapcopy_users', JSON.stringify(users));
  localStorage.setItem(
    'snapcopy_session',
    JSON.stringify({ email: newUser.email, name: newUser.name })
  );

  alert('¡Cuenta creada! Bienvenido, ' + newUser.name + '.');
  // Aquí puedes redirigir: window.location.href = '/dashboard';
});

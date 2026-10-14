// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyALRCCnncQw9gna2qO4Ide9BOFLuLWXmdU",
  authDomain: "tonallitech-51348.firebaseapp.com",
  databaseURL: "https://tonallitech-51348-default-rtdb.firebaseio.com",
  projectId: "tonallitech-51348",
  storageBucket: "tonallitech-51348.firebasestorage.app",
  messagingSenderId: "879533126682",
  appId: "1:879533126682:web:c4a4baa7dad6b5e4ba8da3"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
  const TELEFONO_WHATSAPP = "527712029400";

  const DEFAULT_SETTINGS = {
    startTime: "09:00",
    endTime: "18:00",
    workDays: [1, 2, 3, 4, 5]
  };

  // --- 1. AVISO DE HORARIO EN FORMULARIO ---
  const availabilityNotice = document.getElementById('availabilityNotice');
  const settings = JSON.parse(localStorage.getItem('tonalliScheduleSettings')) || DEFAULT_SETTINGS;

  if (availabilityNotice) {
    const daysNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const activeDaysNames = settings.workDays.map(d => daysNames[d]).join(', ');
    availabilityNotice.innerHTML = `🕒 <strong>Horario de atención:</strong> ${settings.startTime} a ${settings.endTime} hrs (${activeDaysNames || 'Sin días configurados'})`;
  }

  // --- 2. FAQ ACORDEÓN ---
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      button.parentElement.classList.toggle('active');
    });
  });

  // --- 3. FORMULARIO DE AGENDAR CITA ---
  const form = document.getElementById('appointmentForm');
  const confirmationBox = document.getElementById('confirmationBox');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
  const btnReset = document.getElementById('btnResetForm');

  let citaGlobalData = {};

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const nombre = document.getElementById('nombre').value;
      const email = document.getElementById('email').value;
      const telefono = document.getElementById('telefono').value;
      const servicio = document.getElementById('servicio').value;
      const fecha = document.getElementById('fecha').value;
      const hora = document.getElementById('hora').value;
      const mapsLink = document.getElementById('mapsLink').value;
      const mensaje = document.getElementById('mensaje').value;

      const currentSettings = JSON.parse(localStorage.getItem('tonalliScheduleSettings')) || DEFAULT_SETTINGS;
      const currentBlockedDates = JSON.parse(localStorage.getItem('tonalliBlockedDates')) || [];

      // Validar si la fecha está bloqueada
      if (currentBlockedDates.includes(fecha)) {
        alert('🚫 Lo sentimos, la fecha seleccionada está bloqueada. Por favor elige otro día.');
        return false;
      }

      // Validar día de la semana
      const dateParts = fecha.split('-');
      const selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const dayOfWeek = selectedDate.getDay();

      if (!currentSettings.workDays.includes(dayOfWeek)) {
        alert('📅 No atendemos citas en el día de la semana seleccionado. Por favor revisa nuestros días laborales.');
        return false;
      }

      // Validar hora de atención
      if (hora < currentSettings.startTime || hora > currentSettings.endTime) {
        alert(`⏰ La hora seleccionada está fuera de nuestro horario laboral (${currentSettings.startTime} a ${currentSettings.endTime} hrs).`);
        return false;
      }

      citaGlobalData = { 
        nombre, 
        email, 
        telefono, 
        servicio, 
        fecha, 
        hora, 
        mapsLink,
        mensaje,
        estado: "Pendiente",
        tratoCerrado: false,
        notasInternas: "",
        timestamp: Date.now()
      };

      try {
        // Guardar la cita en Firebase Realtime Database en tiempo real
        await db.ref('citas').push(citaGlobalData);

        // Actualizar la interfaz de usuario
        confirmationDetails.innerHTML = `Gracias <strong>${nombre}</strong>, tu cita para <strong>${servicio}</strong> quedó registrada el día <strong>${fecha}</strong> a las <strong>${hora} hrs</strong>.`;

        form.classList.add('hidden');
        confirmationBox.classList.remove('hidden');

        // Abrir WhatsApp con la información prellenada
        enviarCitaPorWhatsApp(citaGlobalData);

      } catch (err) {
        console.error("Error guardando cita:", err);
        alert("Ocurrió un inconveniente conectando con la nube, pero abriremos tu WhatsApp para confirmar tu cita directamente.");
        enviarCitaPorWhatsApp(citaGlobalData);
      }

      return false;
    });
  }

  function enviarCitaPorWhatsApp(cita) {
    if (!cita.nombre) return;
    const mapsPart = cita.mapsLink ? `\n📍 *Ubicación Maps:* ${cita.mapsLink}` : '';
    const textoMsg = `Hola *TonalliTech*, acabo de agendar una cita desde su página web:\n\n👤 *Nombre:* ${cita.nombre}\n📧 *Email:* ${cita.email}\n📞 *Teléfono:* ${cita.telefono}\n🛠️ *Servicio:* ${cita.servicio}\n📅 *Fecha:* ${cita.fecha}\n⏰ *Hora:* ${cita.hora} hrs${mapsPart}\n💬 *Detalles:* ${cita.mensaje || 'Sin notas adicionales'}\n\nQuedo a la espera de su confirmación.`;

    const url = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(textoMsg)}`;
    window.open(url, '_blank');
  }

  if (btnSendWhatsApp) {
    btnSendWhatsApp.addEventListener('click', (e) => {
      e.preventDefault();
      enviarCitaPorWhatsApp(citaGlobalData);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      citaGlobalData = {};
      confirmationBox.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }
});

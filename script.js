import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyALRCCnncQw9gna2qO4Ide9BOFLuLWXmdU",
  authDomain: "tonallitech-51348.firebaseapp.com",
  databaseURL: "https://tonallitech-51348-default-rtdb.firebaseio.com",
  projectId: "tonallitech-51348",
  storageBucket: "tonallitech-51348.firebasestorage.app",
  messagingSenderId: "879533126682",
  appId: "1:879533126682:web:c4a4baa7dad6b5e4ba8da3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  const TELEFONO_WHATSAPP = "527712029400";

  const DEFAULT_SETTINGS = {
    startTime: "09:00",
    endTime: "18:00",
    workDays: [1, 2, 3, 4, 5]
  };

  const availabilityNotice = document.getElementById('availabilityNotice');
  const settings = JSON.parse(localStorage.getItem('tonalliScheduleSettings')) || DEFAULT_SETTINGS;

  if (availabilityNotice) {
    const daysNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const activeDaysNames = settings.workDays.map(d => daysNames[d]).join(', ');
    availabilityNotice.innerHTML = `🕒 <strong>Horario de atención:</strong> ${settings.startTime} a ${settings.endTime} hrs (${activeDaysNames || 'Sin días configurados'})`;
  }

  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      button.parentElement.classList.toggle('active');
    });
  });

  const form = document.getElementById('appointmentForm');
  const confirmationBox = document.getElementById('confirmationBox');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
  const btnReset = document.getElementById('btnResetForm');

  let citaGlobalData = {};

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

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

      if (currentBlockedDates.includes(fecha)) {
        alert('🚫 Lo sentimos, la fecha seleccionada está bloqueada. Por favor elige otro día.');
        return;
      }

      const dateParts = fecha.split('-');
      const selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const dayOfWeek = selectedDate.getDay();

      if (!currentSettings.workDays.includes(dayOfWeek)) {
        alert('📅 No atendemos citas en el día de la semana seleccionado. Por favor revisa nuestros días laborales.');
        return;
      }

      if (hora < currentSettings.startTime || hora > currentSettings.endTime) {
        alert(`⏰ La hora seleccionada está fuera de nuestro horario laboral (${currentSettings.startTime} a ${currentSettings.endTime} hrs).`);
        return;
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
        const citasRef = ref(db, 'citas');
        await push(citasRef, citaGlobalData);

        confirmationDetails.innerHTML = `Gracias <strong>${nombre}</strong>, tu cita para <strong>${servicio}</strong> quedó registrada el día <strong>${fecha}</strong> a las <strong>${hora} hrs</strong>.`;

        form.classList.add('hidden');
        confirmationBox.classList.remove('hidden');

        enviarCitaPorWhatsApp(citaGlobalData);
      } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Ocurrió un detalle al sincronizar con la nube, pero te abriremos WhatsApp para confirmar tu cita.");
        enviarCitaPorWhatsApp(citaGlobalData);
      }
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
    btnSendWhatsApp.addEventListener('click', () => {
      enviarCitaPorWhatsApp(citaGlobalData);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      citaGlobalData = {};
      confirmationBox.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }
});

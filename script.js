import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuración de Firebase TonalliTech
const firebaseConfig = {
  apiKey: "AIzaSyALRCCnncQw9gna2qO4Ide9BOFLuLWXmdU",
  authDomain: "tonallitech-51348.firebaseapp.com",
  databaseURL: "https://tonallitech-51348-default-rtdb.firebaseio.com",
  projectId: "tonallitech-51348",
  storageBucket: "tonallitech-51348.firebasestorage.app",
  messagingSenderId: "879533126682",
  appId: "1:879533126682:web:c4a4baa7dad6b5e4ba8da3",
  measurementId: "G-NKQMG6MY7W"
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

  // FAQ Acordeón
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      button.parentElement.classList.toggle('active');
    });
  });

  // Formulario
  const form = document.getElementById('appointmentForm');
  const confirmationBox = document.getElementById('confirmationBox');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
  const btnReset = document.getElementById('btnResetForm');

  let citaData = {};

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

      citaData = { 
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
        // Enviar la cita a Firebase en la nube
        const citasRef = ref(db, 'citas');
        await push(citasRef, citaData);

        confirmationDetails.innerHTML = `Gracias <strong>${nombre}</strong>, tu cita para <strong>${servicio}</strong> quedó registrada el día <strong>${fecha}</strong> a las <strong>${hora} hrs</strong>.`;

        form.classList.add('hidden');
        confirmationBox.classList.remove('hidden');

        enviarCitaPorWhatsApp(citaData);
      } catch (error) {
        console.error("Error al guardar en la nube:", error);
        alert("Ocurrió un pequeño detalle al conectar con la nube, pero te abriremos WhatsApp para no perder tu cita.");
        enviarCitaPorWhatsApp(citaData);
      }
    });
  }

  function enviarCitaPorWhatsApp(cita) {
    if (!cita.nombre) return;
    const mapsPart = cita.mapsLink ? `\n📍 *Ubicación Maps:* ${cita.mapsLink}` : '';
    const textoMsg = `Hola *TonalliTech*, acabo de agendar una cita desde su página web:\n\n👤 *Nombre:* ${cita.nombre}\n📧 *Email:* ${cita.email}\n📞 *Teléfono:* ${cita.telefono}\n🛠️ *Servicio:* ${cita.servicio}\n📅 *Fecha:* ${cita.fecha}\n⏰ *Hora:* ${cita.hora} hrs${mapsPart}\n💬 *Detalles:* ${cita.mensaje || 'Sin notas adicionales'}\n\nQuedo a la espera de su confirmación.`;

    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(textoMsg)}`, '_blank');
  }

  if (btnSendWhatsApp) {
    btnSendWhatsApp.addEventListener('click', () => enviarCitaPorWhatsApp(citaData));
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      citaData = {};
      confirmationBox.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }
});

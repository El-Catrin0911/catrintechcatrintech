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
    button.addEventListener('click', () => {
      const faqItem = button.parentElement;
      faqItem.classList.toggle('active');
    });
  });

  // --- 3. FORMULARIO DE CITAS MULTIDISPOSITIVO ---
  const form = document.getElementById('appointmentForm');
  const confirmationBox = document.getElementById('confirmationBox');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const btnSendWhatsApp = document.getElementById('btnSendWhatsApp');
  const btnReset = document.getElementById('btnResetForm');

  let citaData = {};

  if (form) {
    form.addEventListener('submit', (e) => {
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
        alert('🚫 Lo sentimos, la fecha seleccionada está bloqueada para citas. Por favor elige otro día.');
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
        notasInternas: ""
      };

      // Guardar en el dispositivo local por respaldo
      let citasGuardadas = JSON.parse(localStorage.getItem('tonalliTechCitas')) || [];
      citasGuardadas.push(citaData);
      localStorage.setItem('tonalliTechCitas', JSON.stringify(citasGuardadas));

      confirmationDetails.innerHTML = `Gracias <strong>${nombre}</strong>, tu cita para <strong>${servicio}</strong> quedó registrada el día <strong>${fecha}</strong> a las <strong>${hora} hrs</strong>.`;

      form.classList.add('hidden');
      confirmationBox.classList.remove('hidden');

      // ABRIR AUTOMÁTICAMENTE WHATSAPP EN CUALQUIER DISPOSITIVO (CELULAR O PC)
      enviarCitaPorWhatsApp(citaData);
    });
  }

  function enviarCitaPorWhatsApp(cita) {
    if (!cita.nombre) return;

    const mapsPart = cita.mapsLink ? `\n📍 *Ubicación Maps:* ${cita.mapsLink}` : '';

    const textoMsg = 
`Hola *TonalliTech*, acabo de agendar una cita desde su página web:

👤 *Nombre:* ${cita.nombre}
📧 *Email:* ${cita.email}
📞 *Teléfono:* ${cita.telefono}
🛠️ *Servicio:* ${cita.servicio}
📅 *Fecha:* ${cita.fecha}
⏰ *Hora:* ${cita.hora} hrs${mapsPart}
💬 *Detalles:* ${cita.mensaje || 'Sin notas adicionales'}

Quedo a la espera de su confirmación.`;

    const url = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(textoMsg)}`;
    window.open(url, '_blank');
  }

  // --- 4. REENVIAR A WHATSAPP DIRECTO ---
  if (btnSendWhatsApp) {
    btnSendWhatsApp.addEventListener('click', () => {
      enviarCitaPorWhatsApp(citaData);
    });
  }

  // --- 5. REINICIAR FORMULARIO ---
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      citaData = {};
      confirmationBox.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }

});

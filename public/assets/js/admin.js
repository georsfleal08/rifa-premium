// Configurar Supabase (mismos datos que en public.js)
const supabaseUrl = 'https://pjanpbtrltcymctcdooc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYW5wYnRybHRjeW1jdGNkb29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDk3NjUsImV4cCI6MjA2ODg4NTc2NX0.HAaRvO405cdtxGiftMeej1zcPTNE7YvVttJZZBC5K9I';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Elementos del DOM
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    btnLogin.addEventListener('click', loginAdmin);
    if (btnLogout) btnLogout.addEventListener('click', logoutAdmin);
});

// Verificar sesión activa
function checkSession() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    }
}

// Iniciar sesión
async function loginAdmin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
            
        if (error || !admin) {
            document.getElementById('login-message').textContent = 'Credenciales incorrectas';
            return;
        }
        
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        loadDashboardData();
        
    } catch (error) {
        document.getElementById('login-message').textContent = 'Error: ' + error.message;
    }
}

// Mostrar panel
function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

// Cargar datos del panel
async function loadDashboardData() {
    try {
        // Obtener rifa activa
        const { data: raffle, error: raffleError } = await supabase
            .from('raffles')
            .select('*')
            .eq('is_active', true)
            .single();
            
        if (raffleError) throw raffleError;
        
        // Obtener pagos
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (paymentsError) throw paymentsError;
        
        // Calcular estadísticas
        const soldTickets = raffle.sold_tickets;
        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        
        // Actualizar UI
        document.getElementById('sold-tickets').textContent = soldTickets;
        document.getElementById('total-amount').textContent = `Bs. ${totalAmount.toFixed(2)}`;
        document.getElementById('pending-payments').textContent = pendingPayments;
        
        // Mostrar pagos
        const paymentsList = document.getElementById('payments-list');
        paymentsList.innerHTML = '';
        
        payments.forEach(payment => {
            const paymentElement = document.createElement('div');
            paymentElement.className = 'payment-item';
            paymentElement.innerHTML = `
                <p><strong>${payment.user_name}</strong> - ${payment.user_phone}</p>
                <p>${payment.tickets_count} tickets - Bs. ${payment.amount.toFixed(2)}</p>
                <p>Estado: ${payment.status}</p>
                ${payment.receipt_url ? `<a href="${payment.receipt_url}" target="_blank">Ver comprobante</a>` : ''}
            `;
            paymentsList.appendChild(paymentElement);
        });
        
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Cerrar sesión
function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}
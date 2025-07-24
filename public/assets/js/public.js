// Configurar Supabase
const supabaseUrl = 'https://pjanpbtrltcymctcdooc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYW5wYnRybHRjeW1jdGNkb29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDk3NjUsImV4cCI6MjA2ODg4NTc2NX0.HAaRvO405cdtxGiftMeej1zcPTNE7YvVttJZZBC5K9I';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables globales
let currentRaffle = null;
let ticketCount = 0;

// Elementos del DOM
const btnMinus = document.getElementById('btn-minus');
const btnPlus = document.getElementById('btn-plus');
const ticketCountElement = document.getElementById('ticket-count');
const totalAmountElement = document.getElementById('total-amount');
const btnBuy = document.getElementById('btn-buy');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadRaffle();
    setupEventListeners();
});

// Cargar datos de la rifa
async function loadRaffle() {
    try {
        const { data, error } = await supabase
            .from('raffles')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error) throw error;
        
        currentRaffle = data;
        document.getElementById('raffle-title').textContent = data.title;
        document.getElementById('ticket-price').textContent = `Bs. ${data.ticket_price.toFixed(2)}`;
        document.getElementById('available-tickets').textContent = data.total_tickets - data.sold_tickets;
    } catch (error) {
        console.error('Error cargando rifa:', error);
        document.getElementById('message').textContent = 'Error cargando la rifa';
    }
}

// Configurar eventos
function setupEventListeners() {
    btnMinus.addEventListener('click', () => updateTicketCount(-1));
    btnPlus.addEventListener('click', () => updateTicketCount(1));
    btnBuy.addEventListener('click', processPurchase);
}

// Actualizar contador de tickets
function updateTicketCount(change) {
    const newCount = ticketCount + change;
    if (newCount >= 0 && newCount <= 10) {
        ticketCount = newCount;
        ticketCountElement.textContent = ticketCount;
        totalAmountElement.textContent = `Bs. ${(ticketCount * currentRaffle.ticket_price).toFixed(2)}`;
    }
}

// Procesar compra
async function processPurchase() {
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const receiptFile = document.getElementById('receipt').files[0];
    
    if (!fullname || !phone) {
        document.getElementById('message').textContent = 'Complete todos los campos';
        return;
    }
    
    if (ticketCount === 0) {
        document.getElementById('message').textContent = 'Seleccione al menos un ticket';
        return;
    }
    
    if (!receiptFile) {
        document.getElementById('message').textContent = 'Suba un comprobante de pago';
        return;
    }
    
    try {
        // Subir comprobante
        const receiptUrl = await uploadReceipt(receiptFile);
        
        // Crear registro de pago
        const { data: payment, error } = await supabase
            .from('payments')
            .insert([{
                raffle_id: currentRaffle.id,
                user_name: fullname,
                user_phone: phone,
                tickets_count: ticketCount,
                amount: ticketCount * currentRaffle.ticket_price,
                receipt_url: receiptUrl
            }])
            .select()
            .single();

        if (error) throw error;
        
        document.getElementById('message').textContent = '¡Compra exitosa! Su pago está en revisión';
        resetForm();
        
    } catch (error) {
        console.error('Error en compra:', error);
        document.getElementById('message').textContent = 'Error: ' + error.message;
    }
}

// Subir comprobante
async function uploadReceipt(file) {
    const fileName = `receipt_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

    if (error) throw error;
    
    return supabase.storage
        .from('receipts')
        .getPublicUrl(data.path).data.publicUrl;
}

// Resetear formulario
function resetForm() {
    ticketCount = 0;
    ticketCountElement.textContent = '0';
    totalAmountElement.textContent = 'Bs. 0,00';
    document.getElementById('fullname').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('receipt').value = '';
}
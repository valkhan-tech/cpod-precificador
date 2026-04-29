// Configuração dos campos para armazenamento local
const campos = [
    'custo', 'embalagem', 'taxa', 'imposto',
    'margem_desejada', 'preco_venda', 'quantidade', 'imposto_mei'
];

// Função para formatar valores em Real brasileiro
function formatarReal(valor) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(valor);
}

// Função para animar o header no scroll
function handleHeaderScroll() {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }
}

// Função para mostrar/ocultar botão "voltar ao topo"
function handleBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (window.scrollY > 100) {
        backToTop.classList.add('active');
    } else {
        backToTop.classList.remove('active');
    }
}

// Função para smooth scroll
function smoothScrollTo(element) {
    const targetElement = document.querySelector(element);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Função principal de cálculo
function calcularPrecificacao(dados) {
    const {
        custo,
        embalagem,
        taxa,
        imposto,
        impostoMei,
        margemDesejada,
        precoVendaInput,
        quantidade
    } = dados;

    const custoUnitario = custo + embalagem;

    let precoVenda;
    if (precoVendaInput > 0) {
        precoVenda = precoVendaInput;
    } else {
        const impostoCalculado = (impostoMei > 0 ? 0 : imposto);
        precoVenda = custoUnitario / (1 - taxa - impostoCalculado - margemDesejada);
    }

    const investimento = custoUnitario * quantidade;
    const receita = precoVenda * quantidade;
    const totalTaxa = receita * taxa;
    const totalImposto = impostoMei > 0 ? impostoMei : receita * imposto;
    const lucro = receita - investimento - totalTaxa - totalImposto;
    const margemReal = (lucro / receita) * 100;

    return {
        precoVenda,
        investimento,
        receita,
        totalTaxa,
        totalImposto,
        lucro,
        margemReal,
        custoUnitario,
        custo,
        embalagem,
        quantidade
    };
}

// Função para atualizar a interface com os resultados
function atualizarResultados(resultados) {
    const {
        precoVenda,
        investimento,
        receita,
        totalTaxa,
        totalImposto,
        lucro,
        margemReal,
        custo,
        embalagem,
        quantidade
    } = resultados;

    // Atualizar preço sugerido
    document.getElementById('preco_sugerido').innerText = formatarReal(precoVenda);

    // Atualizar valores principais
    document.getElementById('investimento').innerText = formatarReal(investimento);
    document.getElementById('receita').innerText = formatarReal(receita);

    // Atualizar lucro e margem com cores dinâmicas
    const lucroSpan = document.getElementById('lucro');
    const margemSpan = document.getElementById('margem');
    
    lucroSpan.innerText = formatarReal(lucro);
    margemSpan.innerText = margemReal.toFixed(2);

    // Aplicar classes de cor baseadas na margem
    lucroSpan.className = '';
    margemSpan.className = '';
    
    if (margemReal < 3) {
        lucroSpan.classList.add('text-danger', 'fw-bold');
        margemSpan.classList.add('text-danger', 'fw-bold');
    } else if (margemReal < 10) {
        lucroSpan.classList.add('text-warning', 'fw-bold');
        margemSpan.classList.add('text-warning', 'fw-bold');
    } else if (margemReal < 20) {
        lucroSpan.classList.add('text-primary', 'fw-bold');
        margemSpan.classList.add('text-primary', 'fw-bold');
    } else {
        lucroSpan.classList.add('text-success', 'fw-bold');
        margemSpan.classList.add('text-success', 'fw-bold');
    }

    // Atualizar detalhamento dos custos
    document.getElementById('custo_produto').innerText = formatarReal(custo * quantidade);
    document.getElementById('custo_embalagem').innerText = formatarReal(embalagem * quantidade);
    document.getElementById('custo_taxa').innerText = formatarReal(totalTaxa);
    document.getElementById('custo_imposto').innerText = formatarReal(totalImposto);
    document.getElementById('custo_outros').innerText = formatarReal(0);

    // Mostrar seção de resultados
    document.getElementById('resultado').style.display = 'block';
}

// Função para carregar valores salvos do localStorage
function carregarValoresSalvos() {
    campos.forEach(campo => {
        const valor = localStorage.getItem(campo);
        if (valor !== null) {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = valor;
            }
        }
    });
}

// Função para salvar valores no localStorage
function salvarValores() {
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('input', (e) => {
                localStorage.setItem(campo, e.target.value);
            });
        }
    });
}

// Função para mostrar modal de ajuda
function mostrarModalAjuda() {
    const ajudaModal = new bootstrap.Modal(document.getElementById('modalAjuda'));
    ajudaModal.show();
}

// Função de inicialização
function inicializar() {
    // Carregar valores salvos
    carregarValoresSalvos();
    
    // Configurar salvamento automático
    salvarValores();
    
    // Mostrar modal de ajuda no primeiro acesso
    if (!localStorage.getItem('ajuda_vista')) {
        mostrarModalAjuda();
        localStorage.setItem('ajuda_vista', '1');
    }
    
    // Configurar evento do botão de ajuda
    const btnAjuda = document.getElementById('btnAjuda');
    if (btnAjuda) {
        btnAjuda.addEventListener('click', mostrarModalAjuda);
    }
    
    // Configurar eventos de scroll
    window.addEventListener('scroll', () => {
        handleHeaderScroll();
        handleBackToTop();
    });
    
    // Configurar botão "voltar ao topo"
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Configurar formulário
    const form = document.getElementById('form-simulacao');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const dados = {
                custo: parseFloat(document.getElementById('custo').value) || 0,
                embalagem: parseFloat(document.getElementById('embalagem').value) || 0,
                taxa: parseFloat(document.getElementById('taxa').value) / 100 || 0,
                imposto: parseFloat(document.getElementById('imposto').value) / 100 || 0,
                impostoMei: parseFloat(document.getElementById('imposto_mei').value) || 0,
                margemDesejada: parseFloat(document.getElementById('margem_desejada').value) / 100 || 0,
                precoVendaInput: parseFloat(document.getElementById('preco_venda').value) || 0,
                quantidade: parseInt(document.getElementById('quantidade').value) || 1
            };
            
            // Calcular e mostrar resultados
            const resultados = calcularPrecificacao(dados);
            atualizarResultados(resultados);
            
            // Tracking do Google Analytics
            if (typeof trackPricingCalculation === 'function') {
                trackPricingCalculation({
                    custo: dados.custo,
                    margem_desejada: dados.margemDesejada * 100,
                    quantidade: dados.quantidade,
                    preco_venda: resultados.precoVenda,
                    margem_real: resultados.margemReal
                });
            }
            
            // Scroll suave para a seção de resultados
            setTimeout(() => {
                smoothScrollTo('#resultado');
            }, 100);
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializar);

// Adicionar algumas funções utilitárias globais
window.PrecificadorApp = {
    formatarReal,
    calcularPrecificacao,
    mostrarModalAjuda,
    smoothScrollTo
};

// script.js - Completo e Corrigido com Edição, Exclusão, Validação UI e Filtro

// --- Constantes da Aplicação ---
const LOCAL_STORAGE_KEY = 'userSkills';
const PROFICIENCY_MIN = 1;
const PROFICIENCY_MAX = 5;
const INTEREST_MIN = 1;
const INTEREST_MAX = 5;
const EXPERIENCE_UNITS = ['anos', 'meses', 'horas'];

// Constantes para a lógica de análise
const STRONG_PROFICIENCY_THRESHOLD = 4;
const STRONG_EXPERIENCE_YEARS_THRESHOLD = 1;
const WEAK_PROFICIENCY_THRESHOLD = 2;
const HIGH_INTEREST_THRESHOLD = 4;
const IMPROVEMENT_OPPORTUNITY_PROFICIENCY_MAX = 3;


// --- Array para armazenar as habilidades ---
let mySkills = [];
// Variável para controlar o índice da habilidade que está sendo editada
let editingIndex = -1;


// --- Obter referências para os elementos do DOM ---
const skillForm = document.getElementById('skill-form');
const formTitle = document.getElementById('form-title');
const addSkillBtn = document.getElementById('add-skill-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editingSkillIndexInput = document.getElementById('editing-skill-index');

const skillNameInput = document.getElementById('skill-name');
const skillCategoryInput = document.getElementById('skill-category');
const skillProficiencyInput = document.getElementById('skill-proficiency');
const skillExperienceInput = document.getElementById('skill-experience');
const skillExperienceUnitInput = document.getElementById('skill-experience-unit');
const skillContextInput = document.getElementById('skill-context');
const skillInterestInput = document.getElementById('skill-interest');

// Referências para mensagens de erro
const skillNameError = document.getElementById('skill-name-error');
const skillCategoryError = document.getElementById('skill-category-error');
const skillProficiencyError = document.getElementById('skill-proficiency-error');
const skillExperienceError = document.getElementById('skill-experience-error');
const skillContextError = document.getElementById('skill-context-error');
const skillInterestError = document.getElementById('skill-interest-error');


const skillsListUl = document.querySelector('#skills-list ul');
const filterCategorySelect = document.getElementById('filter-category');

const proficiencyChartCanvas = document.getElementById('proficiency-chart');
const interestChartCanvas = document.getElementById('interest-chart');
const categoryPieChartCanvas = document.getElementById('category-pie-chart');
const categoryRadarChartCanvas = document.getElementById('category-radar-chart');

const strengthsListUl = document.getElementById('strengths-list');
const weaknessesListUl = document.getElementById('weaknesses-list');
const recommendationsListUl = document.getElementById('recommendations-list');


// --- Variáveis para os gráficos Chart.js ---
let proficiencyChart;
let interestChart;
let categoryPieChart;
let categoryRadarChart;


// --- Carregar dados do localStorage ao carregar a página ---
document.addEventListener('DOMContentLoaded', () => {
    const storedSkills = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSkills) {
        try {
            mySkills = JSON.parse(storedSkills);
            if (!Array.isArray(mySkills)) {
                mySkills = [];
            }
        } catch (e) {
            console.error("Erro ao carregar dados do localStorage:", e);
            mySkills = [];
        }
    }
    populateFilterCategories();
    renderSkills();
    updateCharts();
    runAnalysis();
});


// --- Adicionar ouvinte de evento para o formulário ---
skillForm.addEventListener('submit', (event) => {
    event.preventDefault();

    clearErrorMessages();

    const name = skillNameInput.value.trim();
    const category = skillCategoryInput.value;
    const proficiency = parseInt(skillProficiencyInput.value);
    const experience = parseFloat(skillExperienceInput.value);
    const experienceUnit = skillExperienceUnitInput.value;
    const context = skillContextInput.value;
    const interest = parseInt(skillInterestInput.value);

    let isValid = true;

    if (!name) {
         displayErrorMessage(skillNameError, 'Por favor, insira o nome da habilidade.');
         isValid = false;
    }
     if (!category) {
         displayErrorMessage(skillCategoryError, 'Por favor, selecione uma categoria.');
         isValid = false;
    }
    if (isNaN(proficiency) || proficiency < PROFICIENCY_MIN || proficiency > PROFICIENCY_MAX) {
        displayErrorMessage(skillProficiencyError, `O Nível de Proficiência deve ser um número entre ${PROFICIENCY_MIN} e ${PROFICIENCY_MAX}.`);
         isValid = false;
    }
     if (isNaN(interest) || interest < INTEREST_MIN || interest > INTEREST_MAX) {
        displayErrorMessage(skillInterestError, `O Nível de Interesse deve ser um número entre ${INTEREST_MIN} e ${INTEREST_MAX}.`);
         isValid = false;
    }
    if (isNaN(experience) || experience < 0) {
         displayErrorMessage(skillExperienceError, 'O Tempo de Experiência deve ser um número válido e não negativo.');
         isValid = false;
    }
     if (!EXPERIENCE_UNITS.includes(experienceUnit)) {
         displayErrorMessage(skillExperienceError, 'Unidade de experiência inválida.');
         isValid = false;
     }
     if (!context) {
         displayErrorMessage(skillContextError, 'Por favor, selecione o contexto de uso.');
         isValid = false;
    }

    if (!isValid) {
        console.log("Validação falhou.");
        return;
    }

    console.log("Validação bem sucedida.");

    const skillData = {
        name,
        category,
        proficiency,
        experience,
        experienceUnit,
        context,
        interest
    };

    if (editingIndex !== -1) {
        mySkills[editingIndex] = skillData;
        console.log('Habilidade atualizada:', skillData);
    } else {
        mySkills.push(skillData);
        console.log('Nova habilidade adicionada:', skillData);
    }

    saveSkills();
    resetForm();
    populateFilterCategories();

    const currentFilter = filterCategorySelect.value;
    renderSkills(editingIndex !== -1 ? editingIndex : mySkills.length - 1, currentFilter);
    updateCharts();
    runAnalysis();

    console.log('Todas as habilidades:', mySkills);

    skillNameInput.focus();
});

cancelEditBtn.addEventListener('click', resetForm);

skillsListUl.addEventListener('click', (event) => {
    const target = event.target;
    const listItem = target.closest('li');
    if (!listItem) return;

    const index = parseInt(listItem.dataset.index);

    if (target.classList.contains('delete-skill-btn') || target.parentElement.classList.contains('delete-skill-btn')) {
        if (confirm(`Tem certeza que deseja excluir a habilidade "${mySkills[index].name}"?`)) {
            mySkills.splice(index, 1);
            saveSkills();
            populateFilterCategories();
             const currentFilter = filterCategorySelect.value;
            renderSkills(-1, currentFilter);
            updateCharts();
            runAnalysis();
            console.log(`Habilidade no índice ${index} excluída.`);
        }
    } else if (target.classList.contains('edit-skill-btn') || target.parentElement.classList.contains('edit-skill-btn')) {
        editSkill(index);
        console.log(`Editando habilidade no índice ${index}`);
    }
});

filterCategorySelect.addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    filterCategorySelect.dataset.currentFilter = selectedCategory;
    renderSkills(-1, selectedCategory);
    console.log(`Filtro aplicado: ${selectedCategory}`);
});

function saveSkills() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mySkills));
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", e);
    }
}

function editSkill(index) {
    const skill = mySkills[index];

    skillNameInput.value = skill.name;
    skillCategoryInput.value = skill.category;
    skillProficiencyInput.value = skill.proficiency;
    skillExperienceInput.value = skill.experience;
    skillExperienceUnitInput.value = skill.experienceUnit;
    skillContextInput.value = skill.context;
    skillInterestInput.value = skill.interest;

    editingIndex = index;
    editingSkillIndexInput.value = index;

    formTitle.textContent = 'Editar Habilidade';
    addSkillBtn.textContent = 'Atualizar Habilidade';
    cancelEditBtn.classList.remove('hidden');

    skillNameInput.focus();

    clearErrorMessages();
}

function resetForm() {
    skillForm.reset();

    editingIndex = -1;
    editingSkillIndexInput.value = '';

    formTitle.textContent = 'Registrar Nova Habilidade';
    addSkillBtn.textContent = 'Adicionar Habilidade';
    cancelEditBtn.classList.add('hidden');

    clearErrorMessages();
}

function displayErrorMessage(element, message) {
    element.textContent = message;
    element.classList.add('visible');
}

function clearErrorMessages() {
     const errorElements = skillForm.querySelectorAll('.error-message');
     errorElements.forEach(element => {
         element.textContent = '';
         element.classList.remove('visible');
     });
}

function populateFilterCategories() {
    const categories = [...new Set(mySkills.map(skill => skill.category))];
    categories.sort();

    filterCategorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';

    categories.forEach(category => {
        if (category !== 'all') {
             const option = document.createElement('option');
             option.value = category;
             option.textContent = category;
             filterCategorySelect.appendChild(option);
        }
    });

    const currentFilter = filterCategorySelect.dataset.currentFilter || 'all';
     if (filterCategorySelect.querySelector(`option[value="${currentFilter}"]`)) {
         filterCategorySelect.value = currentFilter;
     } else {
         filterCategorySelect.value = 'all';
     }
}

function renderSkills(indexToHighlight = -1, filterCategory = 'all') {
    skillsListUl.innerHTML = '';

    const skillsToRender = filterCategory === 'all' ? mySkills : mySkills.filter(skill => skill.category === filterCategory);

    if (skillsToRender.length === 0) {
        const listItem = document.createElement('li');
        if (filterCategory !== 'all') {
            listItem.textContent = `Nenhuma habilidade encontrada na categoria "${filterCategory}".`;
        } else {
             listItem.textContent = 'Nenhuma habilidade registrada ainda. Use o formulário acima para começar!';
        }
        skillsListUl.appendChild(listItem);
        return;
    }

    skillsToRender.forEach((skill, index) => {
        const listItem = document.createElement('li');

        const originalIndex = mySkills.findIndex(s =>
             s.name === skill.name &&
             s.category === skill.category &&
             s.proficiency === skill.proficiency &&
             s.experience === skill.experience &&
             s.experienceUnit === skill.experienceUnit &&
             s.context === skill.context &&
             s.interest === skill.interest
            );

        listItem.dataset.index = originalIndex;

        listItem.innerHTML = `
            <div class="skill-details">
                <strong>${skill.name}</strong>
                <span>Categoria: ${skill.category}</span>
                <span>Proficiência: ${skill.proficiency}/${PROFICIENCY_MAX}</span>
                <span>Experiência: ${skill.experience} ${skill.experienceUnit}</span>
                <span>Contexto: ${skill.context}</span>
                <span>Interesse: ${skill.interest}/${INTEREST_MAX}</span>
            </div>
            <div class="skill-actions">
                <button class="edit-skill-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="delete-skill-btn" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
            `;

         if (originalIndex === indexToHighlight && skillsToRender.includes(skill)) {
            listItem.classList.add('newly-added');
            requestAnimationFrame(() => {
                listItem.addEventListener('animationend', () => {
                    listItem.classList.remove('newly-added');
                }, { once: true });
            });
        }

        skillsListUl.appendChild(listItem);
    });
}

function getPizzaColors(numSlices) {
     const colorString = getComputedStyle(document.documentElement).getPropertyValue('--chart-pie-colors').trim();
     const colors = colorString.split(',').map(color => color.trim());

     if (numSlices > colors.length) {
         const repeatedColors = [];
         for (let i = 0; i < numSlices; i++) {
             repeatedColors.push(colors[i % colors.length]);
         }
         return repeatedColors;
     }

     return colors.slice(0, numSlices);
}

function getStatsByCategory() {
    const stats = {};

    mySkills.forEach(skill => {
        const category = skill.category;
        if (!stats[category]) {
            stats[category] = {
                count: 0,
                totalProf: 0,
                totalInt: 0
            };
        }
        stats[category].count++;
        stats[category].totalProf += skill.proficiency;
        stats[category].totalInt += skill.interest;
    });

    const avgStats = {};
    Object.keys(stats).forEach(category => {
        avgStats[category] = {
            avgProf: stats[category].totalProf / stats[category].count,
            avgInt: stats[category].totalInt / stats[category].count
        };
    });

    return avgStats;
}

function updateCharts() {
    if (proficiencyChart) proficiencyChart.destroy();
    if (interestChart) interestChart.destroy();
    if (categoryPieChart) categoryPieChart.destroy();
    if (categoryRadarChart) categoryRadarChart.destroy();


    if (mySkills.length === 0) {
         const canvases = [proficiencyChartCanvas, interestChartCanvas, categoryPieChartCanvas, categoryRadarChartCanvas];
         const noDataText = 'Sem dados para o gráfico.';
         const subtleColor = getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim();
         const fontStyle = '16px Segoe UI';

         canvases.forEach(canvas => {
             const ctx = canvas.getContext('2d');
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.fillStyle = subtleColor;
             ctx.font = fontStyle;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(noDataText, canvas.width / 2, canvas.height / 2);
         });

         return;
    }

     const commonChartOptions = {
         responsive: true,
         maintainAspectRatio: false,
          plugins: {
             legend: {
                 labels: {
                     color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim()
                 }
             },
             tooltip: {
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--section-background').trim(),
                titleColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-accent').trim(),
                bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--general-text-color').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                borderWidth: 1,
                cornerRadius: 4,
                 callbacks: {
                      label: function(context) {
                         let label = context.dataset.label || '';
                         if (label) {
                             label += ': ';
                         }
                         if (context.parsed.y !== undefined) {
                              label += context.parsed.y;
                         } else if (context.parsed !== undefined) {
                              label += context.parsed;
                         }
                         return label;
                      }
                 }
             }
          }
    };

    const proficiencyData = {
        labels: mySkills.map(skill => skill.name),
        datasets: [{
            label: 'Nível de Proficiência',
            data: mySkills.map(skill => skill.proficiency),
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-bar-proficiency').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-border-proficiency').trim(),
            borderWidth: 1
        }]
    };
    const proficiencyOptions = {
         ...commonChartOptions,
         scales: {
             y: {
                 beginAtZero: true,
                 max: PROFICIENCY_MAX,
                  title: { display: true, text: `Nível (${PROFICIENCY_MIN}-${PROFICIENCY_MAX})`, color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  ticks: { stepSize: 1, color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                 grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() }
             },
              x: {
                   title: { display: true, text: 'Habilidade', color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() }
              }
         }
    };
    proficiencyChart = new Chart(proficiencyChartCanvas, { type: 'bar', data: proficiencyData, options: proficiencyOptions });

     const interestData = {
        labels: mySkills.map(skill => skill.name),
        datasets: [{
            label: 'Nível de Interesse',
            data: mySkills.map(skill => skill.interest),
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-bar-interest').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-border-interest').trim(),
            borderWidth: 1
        }]
    };
     const interestOptions = {
         ...commonChartOptions,
         scales: {
             y: {
                 beginAtZero: true,
                 max: INTEREST_MAX,
                  title: { display: true, text: `Nível (${INTEREST_MIN}-${INTEREST_MAX})`, color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  ticks: { stepSize: 1, color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                 grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() }
             },
              x: {
                   title: { display: true, text: 'Habilidade', color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim() },
                  grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() }
              }
         }
    };
    interestChart = new Chart(interestChartCanvas, { type: 'bar', data: interestData, options: interestOptions });

    const categoryCounts = {};
    mySkills.forEach(skill => {
        categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    });
    const categories = Object.keys(categoryCounts);
    const counts = Object.values(categoryCounts);
    const pizzaColors = getPizzaColors(categories.length);

    const categoryPieData = {
        labels: categories,
        datasets: [{
            label: 'Número de Habilidades',
            data: counts,
            backgroundColor: pizzaColors,
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--section-background').trim(),
            borderWidth: 2
        }]
    };
     const categoryPieOptions = {
         ...commonChartOptions,
          plugins: {
              ...commonChartOptions.plugins,
              tooltip: {
                  ...commonChartOptions.plugins.tooltip,
                 callbacks: {
                     label: function(context) {
                         let label = context.label || '';
                         if (label) {
                             label += ': ';
                         }
                         label += context.raw;
                         const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                         const percentage = ((context.raw / total) * 100).toFixed(1) + '%';
                         label += ` (${percentage})`;
                         return label;
                     }
                 }
             }
          }
    };
    categoryPieChart = new Chart(categoryPieChartCanvas, { type: 'pie', data: categoryPieData, options: categoryPieOptions });

     const avgStatsByCategory = getStatsByCategory();
     const radarCategories = Object.keys(avgStatsByCategory);

     const radarProfData = radarCategories.map(cat => avgStatsByCategory[cat].avgProf);
     const radarIntData = radarCategories.map(cat => avgStatsByCategory[cat].avgInt);

     const categoryRadarData = {
        labels: radarCategories,
        datasets: [
            {
                label: 'Proficiência Média',
                data: radarProfData,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-proficiency').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-proficiency-border').trim(),
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-proficiency-border').trim(),
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-proficiency-border').trim(),
                borderWidth: 2
            },
             {
                label: 'Interesse Médio',
                data: radarIntData,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-interest').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-interest-border').trim(),
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-interest-border').trim(),
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-radar-interest-border').trim(),
                 borderWidth: 2
            }
        ]
    };
     const categoryRadarOptions = {
         ...commonChartOptions,
         scales: {
             r: {
                 angleLines: {
                     color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                 },
                 grid: {
                     color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                 },
                 pointLabels: {
                     color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim(),
                     font: { size: 12 }
                 },
                 ticks: {
                     beginAtZero: true,
                     max: PROFICIENCY_MAX,
                     stepSize: 1,
                     color: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text-color').trim(),
                     backdropColor: getComputedStyle(document.documentElement).getPropertyValue('--input-background').trim(),
                      backdropPadding: 2,
                      showLabelBackdrop: true
                 },
                  suggestedMin: 0,
                  suggestedMax: PROFICIENCY_MAX
             }
         }
    };
    categoryRadarChart = new Chart(categoryRadarChartCanvas, { type: 'radar', data: categoryRadarData, options: categoryRadarOptions });

}

function runAnalysis() {
    strengthsListUl.innerHTML = '';
    weaknessesListUl.innerHTML = '';
    recommendationsListUl.innerHTML = '';

    if (mySkills.length === 0) {
        strengthsListUl.innerHTML = '<li>Adicione algumas habilidades para que possamos analisar seus pontos fortes!</li>';
        weaknessesListUl.innerHTML = '<li>Adicione algumas habilidades para identificar áreas de melhoria.</li>';
        recommendationsListUl.innerHTML = '<li>Com base nos dados, podemos oferecer recomendações personalizadas. Comece adicionando suas habilidades!</li>';
        return;
    }

    const strengths = mySkills.filter(skill =>
         skill.proficiency >= STRONG_PROFICIENCY_THRESHOLD &&
         (skill.experience > STRONG_EXPERIENCE_YEARS_THRESHOLD || (skill.experience === STRONG_EXPERIENCE_YEARS_THRESHOLD && skill.experienceUnit === 'anos'))
    );

    if (strengths.length > 0) {
        const strongSkillsText = strengths.map(skill => `${skill.name} (Proficiência ${skill.proficiency}/${PROFICIENCY_MAX}, ${skill.experience} ${skill.experienceUnit})`).join(', ');
        const listItem = document.createElement('li');
        listItem.textContent = `🚀 Pontos Fortes: Você demonstra forte domínio em: ${strongSkillsText}. Continue aprimorando e explorando essas áreas!`;
        strengthsListUl.appendChild(listItem);

    } else {
        strengthsListUl.innerHTML = `<li>💪 Pontos Fortes: Ainda não identificamos pontos fortes claros com base nos critérios atuais (Proficiência >= ${STRONG_PROFICIENCY_THRESHOLD} e Experiência > ${STRONG_EXPERIENCE_YEARS_THRESHOLD} ano). Continue registrando suas habilidades para uma análise mais completa!</li>`;
    }

    const weaknesses = mySkills.filter(skill => skill.proficiency <= WEAK_PROFICIENCY_THRESHOLD);

     if (weaknesses.length > 0) {
        const weakSkillsText = weaknesses.map(skill => `${skill.name} (Proficiência ${skill.proficiency}/${PROFICIENCY_MAX})`).join(', ');
        const listItem = document.createElement('li');
        listItem.textContent = `📈 Oportunidades de Melhoria: Áreas com potencial de crescimento: ${weakSkillsText}. Focar no desenvolvimento dessas habilidades pode gerar grandes avanços.`;
        weaknessesListUl.appendChild(listItem);
    } else {
        weaknessesListUl.innerHTML = `<li>✨ Oportunidades de Melhoria: Excelente! Parece que suas habilidades registradas estão acima do nível iniciante (Proficiência > ${WEAK_PROFICIENCY_THRESHOLD}), indicando uma base sólida.</li>`;
    }

    let hasRecommendations = false;

    const improvementOpportunitiesHighInterest = mySkills.filter(skill =>
        skill.proficiency <= IMPROVEMENT_OPPORTUNITY_PROFICIENCY_MAX &&
        skill.interest >= HIGH_INTEREST_THRESHOLD
    );

    if (improvementOpportunitiesHighInterest.length > 0) {
         const skillNames = improvementOpportunitiesHighInterest.map(skill => `${skill.name} (Interesse ${skill.interest}/${INTEREST_MAX})`).join(', ');
         const recommendationItem = document.createElement('li');
         recommendationItem.textContent = `💡 Sugestão: Você demonstrou alto interesse em ${skillNames}. Investir tempo e esforço para aumentar sua proficiência nessas áreas tem grande potencial de satisfação e crescimento!`;
         recommendationsListUl.appendChild(recommendationItem);
         hasRecommendations = true;
    }

     const strongSkillsHighInterest = mySkills.filter(skill =>
        skill.proficiency >= STRONG_PROFICIENCY_THRESHOLD &&
        skill.interest >= HIGH_INTEREST_THRESHOLD
     );

      if (strongSkillsHighInterest.length > 0) {
         const skillNames = strongSkillsHighInterest.map(skill => `${skill.name} (Proficiência ${skill.proficiency}/${PROFICIENCY_MAX}, Interesse ${skill.interest}/${INTEREST_MAX})`).join(', ');
         const recommendationItem = document.createElement('li');
         recommendationItem.textContent = `⭐ Sugestão: Suas habilidades em ${skillNames} são pontos fortes com alto interesse. Considere buscar desafios mais avançados ou compartilhar seu conhecimento com outros para elevar ainda mais seu domínio.`;
         recommendationsListUl.appendChild(recommendationItem);
         hasRecommendations = true;
    }

    if (!hasRecommendations) {
         recommendationsListUl.innerHTML = '<li>🤔 Sugestões: Não identificamos recomendações personalizadas com base nos critérios atuais. Continue adicionando suas habilidades e interesses para uma análise mais profunda.</li>';
    }
}
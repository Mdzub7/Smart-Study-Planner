// DOM Elements
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const closeModal = document.querySelector('.close-modal');
const cancelTaskBtn = document.getElementById('cancel-task');
const taskForm = document.getElementById('task-form');
const pendingTasksList = document.getElementById('pending-tasks-list');
const completedTasksList = document.getElementById('completed-tasks-list');
const taskCardTemplate = document.getElementById('task-card-template');
const progressValue = document.querySelector('.progress-value');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

// Task Data
let tasks = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromLocalStorage();
    renderTasks();
    updateProgress();
});

addTaskBtn.addEventListener('click', () => {
    openModal();
});

closeModal.addEventListener('click', () => {
    closeModalHandler();
});

cancelTaskBtn.addEventListener('click', () => {
    closeModalHandler();
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTask();
});

// Functions
function openModal(taskId = null) {
    // Reset form
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'Add New Task';
    
    // If editing existing task, populate form
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-subject').value = task.subject || '';
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-description').value = task.description || '';
            
            // Set priority radio button
            const priorityRadio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
            if (priorityRadio) priorityRadio.checked = true;
            
            document.getElementById('modal-title').textContent = 'Edit Task';
        }
    }
    
    // Show modal with animation
    taskModal.classList.add('show');
}

function closeModalHandler() {
    taskModal.classList.remove('show');
}

function saveTask() {
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const subject = document.getElementById('task-subject').value.trim();
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const description = document.getElementById('task-description').value.trim();
    
    if (!title || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create or update task
    if (taskId) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                title,
                subject,
                dueDate,
                priority,
                description,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            subject,
            dueDate,
            priority,
            description,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
    }
    
    // Save to localStorage and update UI
    saveTasksToLocalStorage();
    renderTasks();
    updateProgress();
    closeModalHandler();
}

function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function renderTasks() {
    // Clear existing tasks
    pendingTasksList.innerHTML = '';
    completedTasksList.innerHTML = '';
    
    // Sort tasks by due date (soonest first)
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Render each task
    sortedTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        if (task.completed) {
            completedTasksList.appendChild(taskCard);
        } else {
            pendingTasksList.appendChild(taskCard);
        }
    });
}

function createTaskCard(task) {
    // Clone the template
    const taskCard = document.importNode(taskCardTemplate.content, true).querySelector('.task-card');
    
    // Set task data
    taskCard.dataset.id = task.id;
    taskCard.querySelector('.task-title').textContent = task.title;
    taskCard.querySelector('.task-subject').textContent = task.subject || 'No Subject';
    
    // Format date as "Oct 28, 2025"
    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    taskCard.querySelector('.task-due-date').textContent = `Due: ${formattedDate}`;
    
    // Set priority color
    const priorityElement = taskCard.querySelector('.task-priority');
    priorityElement.classList.add(task.priority);
    
    // Set completed status
    const checkbox = taskCard.querySelector('.task-complete');
    checkbox.checked = task.completed;
    if (task.completed) {
        taskCard.classList.add('completed');
    }
    
    // Add event listeners
    checkbox.addEventListener('change', () => {
        toggleTaskCompletion(task.id);
    });
    
    taskCard.querySelector('.edit-task').addEventListener('click', () => {
        openModal(task.id);
    });
    
    taskCard.querySelector('.delete-task').addEventListener('click', () => {
        confirmDeleteTask(task.id);
    });
    
    return taskCard;
}

function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        saveTasksToLocalStorage();
        renderTasks();
        updateProgress();
    }
}

function confirmDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId);
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasksToLocalStorage();
    renderTasks();
    updateProgress();
}

function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    
    let percentage = 0;
    if (totalTasks > 0) {
        percentage = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Update progress circle and bar
    progressValue.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    
    // Update progress text
    progressText.textContent = `You have completed ${completedTasks} of ${totalTasks} tasks.`;
    
    // Update progress circle with conic gradient
    const progressCircle = document.querySelector('.progress-circle');
    progressCircle.style.background = `conic-gradient(var(--accent-color) ${percentage}%, rgba(74, 108, 253, 0.2) ${percentage}%)`;
}

function saveTasksToLocalStorage() {
    localStorage.setItem('smartStudyTasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('smartStudyTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Window click event to close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        closeModalHandler();
    }
});
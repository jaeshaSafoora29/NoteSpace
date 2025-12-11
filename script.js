let notes = JSON.parse(localStorage.getItem('notes')) || [];

const notesContainer = document.getElementById('notesContainer');
const addNoteBtn = document.getElementById('addNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const searchInput = document.getElementById('searchInput');

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotes(filter = '') {
    notesContainer.innerHTML = '';
    notes
        .filter(note => note.title.toLowerCase().includes(filter.toLowerCase()) || note.content.toLowerCase().includes(filter.toLowerCase()))
        .forEach((note, index) => {
        const noteEl = document.createElement('div');
        noteEl.className = 'note';
        noteEl.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <button onclick="deleteNote(${index})">&times;</button>
        `;
        notesContainer.appendChild(noteEl);
    });
}

function addNote() {
    if(noteTitle.value && noteContent.value){
        notes.push({title: noteTitle.value, content: noteContent.value});
        noteTitle.value = '';
        noteContent.value = '';
        saveNotes();
        renderNotes();
    } else {
        alert('Please fill in both title and content!');
    }
}

function deleteNote(index){
    if(confirm('Delete this note?')){
        notes.splice(index, 1);
        saveNotes();
        renderNotes();
    }
}

addNoteBtn.addEventListener('click', addNote);
searchInput.addEventListener('input', () => renderNotes(searchInput.value));

renderNotes();

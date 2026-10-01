const fs = require('fs');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// Load db.js mock or actual
global.MadrassahDB = {
    initDB: async () => {},
    getStudentById: async () => null,
    getAllTeachers: async () => [],
    getAllStudents: async () => [],
    getSetting: async () => null,
    saveSetting: async () => {},
};

// Address data
try {
    require('../assets/js/address-data.js');
} catch (e) {
    console.log('Failed to load address-data:', e.message);
}

// Quran data
try {
    require('../assets/js/quran-data.js');
} catch (e) {
    console.log('Failed to load quran-data:', e.message);
}

// Now read app.js and test running MadrassahApp
try {
    const appCode = fs.readFileSync('app.js', 'utf8');
    // Evaluate app.js in global context
    eval(appCode);
    console.log('app.js evaluated successfully!');
    
    // Test instantiating MadrassahApp
    const app = new MadrassahApp();
    console.log('MadrassahApp instantiated!');
    
    // Test renderAdmissionForm
    const fakeContainer = { innerHTML: '' };
    app.renderAdmissionForm(fakeContainer).then(() => {
        console.log('renderAdmissionForm succeeded! Length of HTML:', fakeContainer.innerHTML.length);
    }).catch(err => {
        console.error('renderAdmissionForm failed with error:', err);
    });

} catch (err) {
    console.error('Evaluation error:', err);
}

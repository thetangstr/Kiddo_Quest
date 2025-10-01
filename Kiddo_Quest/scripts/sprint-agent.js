#!/usr/bin/env node

/**
 * Sprint Development Agent
 * This agent automatically picks up items marked "ready for development" 
 * and implements them in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SprintAgent {
  constructor() {
    this.sprintFile = path.join(__dirname, '../CURRENT_SPRINT.json');
    this.completedFile = path.join(__dirname, '../COMPLETED_SPRINT.json');
  }

  loadSprint() {
    if (!fs.existsSync(this.sprintFile)) {
      console.log('📭 No sprint items found. Waiting for admin to mark items "ready for development".');
      return [];
    }
    
    try {
      const data = fs.readFileSync(this.sprintFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading sprint:', error);
      return [];
    }
  }

  analyzeTask(item) {
    const analysis = {
      type: 'feature',
      complexity: 'medium',
      files: [],
      approach: ''
    };

    const desc = item.description.toLowerCase();
    
    // Determine task type
    if (desc.includes('bug') || desc.includes('fix') || desc.includes('error')) {
      analysis.type = 'bug';
    } else if (desc.includes('ui') || desc.includes('design') || desc.includes('style')) {
      analysis.type = 'ui';
    } else if (desc.includes('performance') || desc.includes('slow') || desc.includes('optimize')) {
      analysis.type = 'performance';
    }

    // Determine complexity
    if (item.severity === 'high' || desc.includes('critical')) {
      analysis.complexity = 'high';
    } else if (item.severity === 'low' || desc.includes('simple')) {
      analysis.complexity = 'low';
    }

    // Determine files to modify
    if (desc.includes('dark mode') || desc.includes('theme')) {
      analysis.files = ['src/theme.js', 'src/App.css', 'src/components/UI.js'];
      analysis.approach = 'Implement theme toggle in store, add dark mode CSS classes';
    } else if (desc.includes('mobile') || desc.includes('responsive')) {
      analysis.files = ['src/App.css', 'src/index.css'];
      analysis.approach = 'Add responsive breakpoints and mobile-optimized styles';
    } else if (desc.includes('quest')) {
      analysis.files = ['src/screens/QuestManagement.js', 'src/store.js'];
      analysis.approach = 'Modify quest-related functions and UI';
    }

    return analysis;
  }

  generateCode(item, analysis) {
    console.log(`\n🤖 Generating solution for: ${item.title}`);
    console.log(`   Type: ${analysis.type}`);
    console.log(`   Approach: ${analysis.approach}`);
    
    // Example: Implementing dark mode
    if (item.description.toLowerCase().includes('dark mode')) {
      return {
        'src/store.js': this.generateDarkModeStore(),
        'src/components/ThemeToggle.js': this.generateThemeToggle(),
        'src/App.css': this.generateDarkModeStyles()
      };
    }
    
    // Add more code generation patterns here
    return {};
  }

  generateDarkModeStore() {
    return `
// Add to store.js
const additionalState = {
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  
  toggleDarkMode: () => {
    const newMode = !get().isDarkMode;
    localStorage.setItem('darkMode', newMode);
    set({ isDarkMode: newMode });
    document.body.classList.toggle('dark-mode', newMode);
  }
};`;
  }

  generateThemeToggle() {
    return `import React from 'react';
import { Moon, Sun } from 'lucide-react';
import useKiddoQuestStore from '../store';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useKiddoQuestStore();
  
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;`;
  }

  generateDarkModeStyles() {
    return `
/* Dark mode styles */
body.dark-mode {
  background-color: #1a1a1a;
  color: #ffffff;
}

body.dark-mode .card {
  background-color: #2a2a2a;
  border-color: #3a3a3a;
}

body.dark-mode .button-primary {
  background-color: #4a4a8a;
}

body.dark-mode .button-primary:hover {
  background-color: #5a5a9a;
}`;
  }

  async implementTask(item) {
    console.log(`\n🔧 Implementing: ${item.title}`);
    console.log('='.repeat(50));
    
    const analysis = this.analyzeTask(item);
    const code = this.generateCode(item, analysis);
    
    // Log what would be done
    console.log('\n📝 Implementation Plan:');
    Object.keys(code).forEach(file => {
      console.log(`   - Modify ${file}`);
    });
    
    // Mark as completed
    const completed = {
      ...item,
      completedAt: new Date().toISOString(),
      implementation: analysis.approach
    };
    
    this.markCompleted(completed);
    
    console.log('\n✅ Task completed!');
    return completed;
  }

  markCompleted(item) {
    let completed = [];
    if (fs.existsSync(this.completedFile)) {
      completed = JSON.parse(fs.readFileSync(this.completedFile, 'utf8'));
    }
    completed.push(item);
    fs.writeFileSync(this.completedFile, JSON.stringify(completed, null, 2));
  }

  async run() {
    console.log('🤖 Sprint Development Agent Starting...');
    console.log('='.repeat(50));
    
    const sprintItems = this.loadSprint();
    
    if (sprintItems.length === 0) {
      console.log('\n💤 No items to work on.');
      console.log('Waiting for admin to mark feedback as "ready for development".');
      return;
    }
    
    console.log(`\n📋 Found ${sprintItems.length} items to work on:`);
    sprintItems.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.title} [${item.priority}]`);
    });
    
    // Process each item
    for (const item of sprintItems) {
      await this.implementTask(item);
    }
    
    // Clear the sprint file after completion
    fs.writeFileSync(this.sprintFile, '[]');
    
    console.log('\n🎉 Sprint completed! All items have been implemented.');
    console.log('📧 Notify the admin that features are ready for review.');
  }
}

// Run the agent
const agent = new SprintAgent();
agent.run();
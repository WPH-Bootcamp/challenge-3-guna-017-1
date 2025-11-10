// Module
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Konstanta
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

// Readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Profile
const userProfile = {
  joinedAt: new Date(),
  totalCompletions: 0,

  updateStats(habits) {
    this.totalCompletions = habits.reduce(
      (sum, h) => sum + h.completions.length,
      0
    );
  },

  getDaysJoined() {
    const now = new Date();
    const diff = now - this.joinedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },
};

// Habbit
class Habit {
  constructor(id, name, targetFrequency) {
    this.id = id;
    this.name = name;
    this.targetFrequency = targetFrequency;
    this.completions = [];
    this.createdAt = new Date();
  }

  markComplete() {
    this.completions.push(new Date());
  }

  getThisWeekCompletions() {
    const now = new Date();
    const weekAgo = new Date(now - DAYS_IN_WEEK * 24 * 60 * 60 * 1000);
    return this.completions.filter((date) => new Date(date) >= weekAgo);
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const count = this.getThisWeekCompletions().length;
    if (!this.targetFrequency || this.targetFrequency === 0) return 0;

    return Math.min(100, Math.round((count / this.targetFrequency) * 100));
  }

  getStatus() {
    return this.isCompletedThisWeek() ? '✅ Selesai' : '⏳ Belum selesai';
  }
}

// Habbit Tracker
class HabitTracker {
  constructor() {
    this.habits = [];
    this.userProfile = null;
    this.reminderInterval = null;
    this.loadFromFile();
  }

  setProfile(name) {
    this.userProfile = {
      name: name ?? 'Tanpa Nama',
      joinedAt: new Date(),
    };
    this.saveToFile();
  }

  addHabit(name, frequency) {
    const habit = new Habit(this.habits.length + 1, name, frequency);
    this.habits.push(habit);
    this.saveToFile();
  }

  completeHabit(index) {
    const habit = this.habits[index];
    if (habit) {
      habit.markComplete();
      this.saveToFile();
    }
  }

  deleteHabit(index) {
    this.habits.splice(index, 1);
    this.saveToFile();
  }

  // Menampilkan Profile
  displayProfile() {
    if (
      !this.userProfile ||
      !this.userProfile.name ||
      !this.userProfile.joinedAt
    ) {
      console.log(
        '\n📭 Profil belum tersedia. Silakan isi data profil terlebih dahulu.\n'
      );
      return;
    }

    const name = this.userProfile.name ?? 'Tanpa Nama';
    const joinedAt = this.userProfile.joinedAt;
    const now = new Date();
    const diff = now - joinedAt;
    const daysJoined = Math.floor(diff / (1000 * 60 * 60 * 24));
    const totalHabits = this.habits.length;

    console.log('\n👤 Profil Pengguna:');
    console.log(`- Nama: ${name}`);
    console.log(`- Bergabung sejak: ${joinedAt.toLocaleDateString()}`);
    console.log(`- Total Kebiasaan: ${totalHabits}`);
    console.log(`- Telah bergabung selama: ${daysJoined} hari\n`);
  }

  // Menghapus Profil
  deleteProfile() {
    if (!this.userProfile) {
      console.log('\n📭 Tidak ada profil yang bisa dihapus.\n');
      return;
    }

    this.userProfile = null;
    this.habits = []; // opsional: hapus semua kebiasaan juga
    this.saveToFile();

    console.log('\n🗑️ Profil dan semua kebiasaan telah dihapus.\n');
  }

  // Menampilkan Habits
  displayHabits(filterFn = null) {
    const list = filterFn ? this.habits.filter(filterFn) : this.habits;
    if (list.length === 0) {
      console.log('\nTidak ada kebiasaan yang tersimpan.\n');
      return;
    }
    list.forEach((h, i) => {
      const name = h.name ?? 'Default';
      const freq = h.targetFrequency ?? 1;
      const progress = h.getThisWeekCompletions().length;
      const percentage = h.getProgressPercentage();
      const status = h.isCompletedThisWeek() ? '[Selesai]' : '[Aktif]';
      const bar = renderProgressBar(percentage);

      console.log(`${i}. ${status} ${name}`);
      console.log(`   Target: ${freq}x/minggu`);
      console.log(`   Progress: ${progress}/${freq} (${percentage}%)`);
      console.log(`   Progress Bar: ${bar}\n`);
    });
  }

  displayHabitsWithWhile() {
    console.log('While Loop');
    let i = 0;
    while (i < this.habits.length) {
      console.log(this.habits[i].name);
      i++;
    }
  }

  displayHabitsWithFor() {
    console.log('For Loop');
    for (let i = 0; i < this.habits.length; i++) {
      console.log(this.habits[i].name);
    }
  }

  // Lihat Statistik
  displayStats() {
    if (this.habits.length === 0) {
      console.log('\n📭 Belum ada kebiasaan untuk dianalisis.\n');
      return;
    }

    this.habits.forEach((h) => {
      console.log(
        `${h.name}: ${h.getThisWeekCompletions().length}/${h.targetFrequency}`
      );
    });
  }

  // Menampilkan Reminder
  startReminder() {
    this.reminderInterval = setInterval(
      () => this.showReminder(),
      REMINDER_INTERVAL
    );
  }

  showReminder() {
    console.log('\n🔔 Jangan lupa tandai kebiasaanmu hari ini!\n');
  }

  stopReminder() {
    clearInterval(this.reminderInterval);
  }

  // Menyimpan Data
  saveToFile() {
    const data = {
      habits: this.habits,
      userProfile: this.userProfile,
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  // Memuat Data
  loadFromFile() {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      if (!raw.trim()) return;

      const parsed = JSON.parse(raw);

      this.habits = Array.isArray(parsed.habits)
        ? parsed.habits.map((h) => {
            const habit = new Habit(h.id, h.name, h.targetFrequency);
            habit.createdAt = new Date(h.createdAt);
            habit.completions = h.completions ?? [];
            return habit;
          })
        : [];

      this.userProfile = parsed.userProfile ?? null;
      if (this.userProfile && this.userProfile.joinedAt) {
        this.userProfile.joinedAt = new Date(this.userProfile.joinedAt);
      }
      if (this.userProfile && typeof this.userProfile.joinedAt === 'string') {
        this.userProfile.joinedAt = new Date(this.userProfile.joinedAt);
      }
    }
  }

  clearAllData() {
    this.habits = [];
    this.saveToFile();
  }
}

// Progress Bar
function renderProgressBar(percentage) {
  const totalBlocks = 10;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);
  return `${bar} ${percentage}%`;
}

// CLI Interface
function askQuestion(question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer))
  );
}

async function displayMenu() {
  console.log(`
📋 MENU:

0. Buat Profil
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
9. Demo Loop
10. Reminder ON
11. Remider Off
12. Hapus Semua Data
13. Keluar
`);
}

async function handleMenu(tracker) {
  while (true) {
    await displayMenu();
    const choice = await askQuestion('Pilih menu: ');
    switch (choice) {
      case '0':
        const userName = await askQuestion('Masukkan nama Anda: ');
        tracker.setProfile(userName);
        console.log('\n✅ Profil berhasil disimpan!\n');
        break;
      case '1':
        tracker.displayProfile();
        break;
      case '2':
        tracker.displayHabits();
        break;
      case '3':
        tracker.displayHabits((h) => !h.isCompletedThisWeek());
        break;
      case '4':
        tracker.displayHabits((h) => h.isCompletedThisWeek());
        break;
      case '5':
        if (
          !tracker.userProfile ||
          !tracker.userProfile.name ||
          !tracker.userProfile.joinedAt
        ) {
          console.log('\n📭 Silahkan buat profil terlebih dahulu.\n');
          break;
        }

        const name = await askQuestion('Nama kebiasaan: ');
        const freq = await askQuestion('Target frekuensi per minggu: ');
        tracker.addHabit(name, parseInt(freq));
        console.log('\n✅ Kebiasaan berhasil ditambahkan!');

        break;
      case '6':
        if (tracker.habits.length === 0) {
          console.log(
            '\n📭 Belum ada kebiasaan yang bisa ditandai. Tambahkan kebiasaan terlebih dahulu.\n'
          );
          break;
        }

        tracker.displayHabits();
        const idx = await askQuestion('Index kebiasaan yang ingin ditandai: ');
        tracker.completeHabit(parseInt(idx));
        break;
      case '7':
        if (tracker.habits.length === 0) {
          console.log(
            '\n📭 Tidak ada kebiasaan yang bisa dihapus. Tambahkan kebiasaan terlebih dahulu.\n'
          );
          break;
        }

        tracker.displayHabits();
        const delIdx = await askQuestion(
          'Index kebiasaan yang ingin dihapus: '
        );
        tracker.deleteHabit(parseInt(delIdx));
        break;
      case '8':
        tracker.displayStats();
        break;
      case '9':
        console.log('\n🔁 Demo While Loop:');
        tracker.displayHabitsWithWhile();
        console.log('\n🔁 Demo For Loop:');
        tracker.displayHabitsWithFor();
        break;
      case '10':
        tracker.startReminder();
        break;
      case '11':
        tracker.stopReminder();
        break;
      case '12':
        const confirm = await askQuestion(
          'Apakah Anda yakin ingin menghapus profil dan semua kebiasaan? (ya/tidak): '
        );
        if (confirm.toLowerCase() === 'ya') {
          tracker.deleteProfile();
        } else {
          console.log('\n❎ Penghapusan dibatalkan.\n');
        }
        break;

      case '13':
        tracker.stopReminder();
        rl.close();
        return;
      default:
        console.log('❌ Pilihan tidak valid.');
    }
  }
}

// Main Function
async function main() {
  console.log('\n🌟 Selamat datang di Habit Tracker CLI 🌟\n');
  const tracker = new HabitTracker();
  await handleMenu(tracker);
}

main();

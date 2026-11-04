const KEY = 'sprout.plants';
const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (n) => Date.now() - n * DAY;

const seed = () => [
  { id: 1, name: 'Fern', every: 3, watered: daysAgo(5) },
  { id: 2, name: 'Snake plant', every: 14, watered: daysAgo(14) },
  {
    id: 3,
    name: "Monstera from Grandma's kitchen, the one by the window",
    every: 7,
    watered: daysAgo(2),
  },
  { id: 4, name: 'Pothos', every: 7, watered: daysAgo(0) },
];

function load() {
  const saved = localStorage.getItem(KEY);
  return saved ? JSON.parse(saved) : seed();
}

let plants = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(plants));
}

// Days until the plant needs water. Negative means overdue.
const dueIn = (plant) =>
  Math.round((plant.watered + plant.every * DAY - Date.now()) / DAY);

function label(days) {
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Water today';
  return `Water in ${days} day${days === 1 ? '' : 's'}`;
}

function render() {
  const list = document.querySelector('#plants');
  list.replaceChildren();
  const sorted = [...plants].sort((a, b) => dueIn(a) - dueIn(b));
  for (const plant of sorted) {
    const item = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = `${plant.name}: ${label(dueIn(plant))} `;
    const water = document.createElement('button');
    water.textContent = 'Water';
    water.addEventListener('click', () => {
      plant.watered = Date.now();
      save();
      render();
    });
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      plants = plants.filter((p) => p !== plant);
      save();
      render();
    });
    item.append(text, water, remove);
    list.append(item);
  }
  const thirsty = plants.filter((p) => dueIn(p) <= 0).length;
  document.querySelector('#summary').textContent =
    `${thirsty} of ${plants.length} need water.`;
  document.querySelector('#empty').hidden = plants.length > 0;
}

document.querySelector('#add').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  plants.push({
    id: Date.now(),
    name: form.get('name').trim(),
    every: Number(form.get('every')),
    watered: Date.now(),
  });
  save();
  event.target.reset();
  render();
});

render();

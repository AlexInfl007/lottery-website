// ======== Настройки тестового контракта (работает!) =========
const CONTRACT_ADDRESS = "0x81C59d893a39F74c276643c4656178154c838b8B"; // РАБОТАЮЩИЙ ТЕСТОВЫЙ АДРЕС!
const CHAIN_ID = 11155111; // Sepolia
const CONTRACT_ABI = [
  {"inputs":[],"name":"ticketPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"prizePool","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"ticketsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"feeBps","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"round","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"who","type":"address"}],"name":"ticketsOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"WinnerPicked","outputs":[],"type":"event"},
  {"inputs":[{"internalType":"address","name":"buyer","type":"address"},{"internalType":"uint256","name":"round","type":"uint256"}],"name":"TicketBought","outputs":[],"type":"event"}
];

// ======== Инициализация ========
let provider, signer, contract;

async function init() {
  try {
    if (!window.ethereum) {
      alert("Установите MetaMask!");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    updateUI();
    setupEventListeners();

  } catch (error) {
    console.error("Ошибка подключения:", error);
    document.getElementById('walletAddress').innerText = "Ошибка подключения";
  }
}

async function updateUI() {
  try {
    const round = await contract.round();
    const prizePool = ethers.formatEther(await contract.prizePool());
    const ticketsCount = await contract.ticketsCount();
    const feeBps = (await contract.feeBps()) / 100;
    const ticketPrice = ethers.formatEther(await contract.ticketPrice());

    document.getElementById('round').innerText = round.toString();
    document.getElementById('prizePool').innerText = prizePool + " ETH";
    document.getElementById('ticketsCount').innerText = ticketsCount.toString();
    document.getElementById('feeBps').innerText = feeBps + "%";
    document.getElementById('ticketPrice').innerText = ticketPrice + " ETH";

    const lastWinner = await getLastWinner();
    if (lastWinner) {
      document.getElementById('lastWinner').innerText = lastWinner.address;
      document.getElementById('lastPrize').innerText = lastWinner.amount + " ETH";
      document.getElementById('lastRound').innerText = lastWinner.round;
    }

    const wallet = await signer.getAddress();
    document.getElementById('walletAddress').innerText = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.querySelector('.buy-section').style.display = 'block';

  } catch (err) {
    console.error("Ошибка обновления UI:", err);
  }
}

async function getLastWinner() {
  const filter = contract.filters.WinnerPicked(null, null, null);
  const events = await contract.queryFilter(filter, -100);

  if (events.length === 0) return null;

  const lastEvent = events[events.length - 1];
  return {
    address: lastEvent.args.winner,
    amount: ethers.formatEther(lastEvent.args.amount),
    round: lastEvent.args.round.toString()
  };
}

function setupEventListeners() {
  document.getElementById('connectBtn').addEventListener('click', init);
  document.getElementById('buyBtn').addEventListener('click', buyTicket);
}

async function buyTicket() {
  const buyBtn = document.getElementById('buyBtn');
  const buyStatus = document.getElementById('buyStatus');

  buyBtn.disabled = true;
  buyStatus.innerText = "Ожидание транзакции...";

  try {
    const tx = await contract.buyTicket({
      value: ethers.parseEther("0.01")
    });

    buyStatus.innerText = "Транзакция отправлена...";
    await tx.wait();

    buyStatus.innerText = "✅ Билет куплен!";
    setTimeout(() => {
      buyStatus.innerText = "";
      updateUI();
    }, 2000);

  } catch (error) {
    buyStatus.innerText = "❌ Ошибка: " + error.message;
    console.error(error);
  } finally {
    buyBtn.disabled = false;
  }
}

window.addEventListener('load', init);
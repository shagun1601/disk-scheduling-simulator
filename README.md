# 💽 Disk Scheduling Simulator

A web-based Disk Scheduling Simulator that helps users visualize and compare different disk scheduling algorithms used in Operating Systems. This project demonstrates how disk requests are serviced and calculates the total head movement for various scheduling techniques.

## 🚀 Features

- Interactive user interface
- Visual representation of disk head movement
- Compare multiple disk scheduling algorithms
- Calculates total seek time / head movement
- User-defined disk requests and initial head position
- Educational tool for Operating Systems students

## 📚 Algorithms Implemented

### 1. FCFS (First Come First Serve)
Processes disk requests in the order they arrive.

### 2. SSTF (Shortest Seek Time First)
Services the request closest to the current head position.

### 3. SCAN (Elevator Algorithm)
Moves the disk head in one direction servicing requests and then reverses direction.

### 4. C-SCAN (Circular SCAN)
Services requests in one direction only and jumps back to the beginning.

### 5. LOOK
Similar to SCAN but only travels as far as the last request.

### 6. C-LOOK
Similar to C-SCAN but only travels between the first and last pending requests.

## 🛠️ Tech Stack

- HTML5
- CSS3
- JavaScript

## 📂 Project Structure

```
disk-scheduling-simulator/
│
├── index.html
├── style.css
├── script.js
├── assets/
│   └── screenshots/
└── README.md
```

## ⚙️ How to Run

1. Clone the repository

```bash
git clone https://github.com/shagun1601/disk-scheduling-simulator.git
```

2. Open the project folder

```bash
cd disk-scheduling-simulator
```

3. Run the application

Simply open:

```bash
index.html
```

in your browser.

## 📈 Input Parameters

- Initial Head Position
- Disk Request Queue
- Disk Size (if applicable)
- Direction of Head Movement (for SCAN/C-SCAN)

## 📊 Output

The simulator displays:

- Sequence of serviced requests
- Total head movement
- Seek distance
- Visual disk head traversal graph

## 🎯 Learning Objectives

This project helps students understand:

- Disk scheduling concepts
- Seek time optimization
- Performance comparison of scheduling algorithms
- Operating System resource management

## 📸 Screenshots

Add screenshots of your simulator here.

### Home Page
![Home Page](assets/screenshots/home.png)

### Simulation Result
![Result](assets/screenshots/result.png)

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a Pull Request

## 👨‍💻 Author

**Shagun Gupta**

B.Tech Computer Science Engineering  
Lovely Professional University

GitHub: https://github.com/shagun1601

## 📄 License

This project is licensed under the MIT License.

---

⭐ If you found this project useful, consider giving it a star on GitHub!

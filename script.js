document.addEventListener("DOMContentLoaded", () => {
    // Set current year in footer
    document.getElementById("current-year").textContent = new Date().getFullYear()
  
    // Hero section - Try Simulator button
    document.getElementById("try-simulator-btn").addEventListener("click", () => {
      document.getElementById("simulation").scrollIntoView({ behavior: "smooth" })
    })
  
    // Algorithm section toggle details
    const detailsToggleBtns = document.querySelectorAll(".details-toggle-btn")
    detailsToggleBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const details = this.closest(".algorithm-section").querySelector(".algorithm-details")
        const isHidden = details.classList.contains("hidden")
  
        details.classList.toggle("hidden")
        this.textContent = isHidden ? "Hide Details" : "Show Details"
      })
    })
  
    // Try in Simulator buttons
    const tryAlgorithmBtns = document.querySelectorAll(".try-algorithm-btn")
    tryAlgorithmBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const algorithm = this.getAttribute("data-algorithm")
        document.getElementById("algorithm-select").value = algorithm
        document.getElementById("simulation").scrollIntoView({ behavior: "smooth" })
        // Trigger change event to update the simulation
        const event = new Event("change")
        document.getElementById("algorithm-select").dispatchEvent(event)
      })
    })
  
    // Simulation functionality
    const algorithmSelect = document.getElementById("algorithm-select")
    const maxRangeInput = document.getElementById("max-range")
    const maxRangeValue = document.getElementById("max-range-value")
    const initialHeadInput = document.getElementById("initial-head")
    const maxHeadValue = document.getElementById("max-head-value")
    const requestsInput = document.getElementById("requests")
    const nValueGroup = document.querySelector(".n-value-group")
    const nValueInput = document.getElementById("n-value")
    const speedInput = document.getElementById("speed")
    const startBtn = document.getElementById("start-btn")
    const pauseBtn = document.getElementById("pause-btn")
    const resetBtn = document.getElementById("reset-btn")
    const exportBtn = document.getElementById("export-btn")
    const sequenceResult = document.getElementById("sequence-result")
    const totalSeekTime = document.getElementById("total-seek-time")
    const averageSeekTime = document.getElementById("average-seek-time")
  
    // Canvas elements
    const diskCanvas = document.getElementById("disk-visualization")
    const diskCtx = diskCanvas.getContext("2d")
    const stepCanvas = document.getElementById("step-visualization")
    const stepCtx = stepCanvas.getContext("2d")
  
    // Simulation state
    let algorithm = algorithmSelect.value
    let maxRange = Number.parseInt(maxRangeInput.value)
    let initialHead = Number.parseInt(initialHeadInput.value)
    let requestInput = requestsInput.value
    let requests = []
    let currentHead = initialHead
    let isAnimating = false
    let animationSpeed = Number.parseFloat(speedInput.value)
    let sequence = []
    let currentStep = 0
    let totalSeekTimeValue = 0
    let averageSeekTimeValue = 0
    let nValue = Number.parseInt(nValueInput.value)
    let weights = []
    let animationId
    let lastTime = 0
  
    // Initialize canvases
    function initializeCanvases() {
      // Set canvas dimensions
      diskCanvas.width = diskCanvas.offsetWidth
      diskCanvas.height = diskCanvas.offsetHeight
      stepCanvas.width = stepCanvas.offsetWidth
      stepCanvas.height = stepCanvas.offsetHeight
  
      // Initial draw
      drawDiskVisualization()
      drawStepVisualization()
    }
  
    // Parse requests from input
    function parseRequests() {
      const positions = requestInput
        .split(" ")
        .map((num) => Number.parseInt(num.trim()))
        .filter((num) => !isNaN(num) && num >= 0 && num <= maxRange)
  
      requests = positions.map((position) => ({
        position,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
        isProcessed: false,
      }))
  
      currentHead = initialHead
      currentStep = 0
      totalSeekTimeValue = 0
      averageSeekTimeValue = 0
      sequence = [initialHead]
  
      // Generate random weights for Weighted SCAN
      weights = positions.map(() => Math.floor(Math.random() * 10) + 1)
    }
  
    // Calculate sequence based on algorithm
    function calculateSequence() {
      if (requests.length === 0) return
  
      const newSequence = [initialHead]
      const newRequests = requests.map((req) => ({ ...req, isProcessed: false }))
      let head = initialHead
      let seekTime = 0
  
      if (algorithm === "fcfs") {
        // First Come First Served
        newRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
      } else if (algorithm === "scan") {
        // SCAN (Elevator) Algorithm
        // Sort requests by position
        const sortedRequests = [...newRequests].sort((a, b) => a.position - b.position)
  
        // Find requests greater than initial head
        const greaterRequests = sortedRequests.filter((req) => req.position >= head)
        // Find requests less than initial head
        const lesserRequests = sortedRequests.filter((req) => req.position < head)
  
        // Process requests in increasing order first
        greaterRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
  
        // Add the end of disk if there were any requests processed in increasing order
        if (greaterRequests.length > 0) {
          seekTime += Math.abs(head - maxRange)
          head = maxRange
          newSequence.push(head)
        }
  
        // Process requests in decreasing order
        lesserRequests.reverse().forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
      } else if (algorithm === "sstf") {
        // Shortest Seek Time First
        const unprocessed = [...newRequests]
  
        while (unprocessed.length > 0) {
          // Find the request with shortest seek time
          let shortestIndex = 0
          let shortestSeek = Math.abs(head - unprocessed[0].position)
  
          for (let i = 1; i < unprocessed.length; i++) {
            const seekDistance = Math.abs(head - unprocessed[i].position)
            if (seekDistance < shortestSeek) {
              shortestSeek = seekDistance
              shortestIndex = i
            }
          }
  
          // Process the request
          seekTime += shortestSeek
          head = unprocessed[shortestIndex].position
          newSequence.push(head)
  
          // Remove the processed request
          unprocessed.splice(shortestIndex, 1)
        }
      } else if (algorithm === "cscan") {
        // C-SCAN (Circular SCAN) Algorithm
        // Sort requests by position
        const sortedRequests = [...newRequests].sort((a, b) => a.position - b.position)
  
        // Find requests greater than or equal to initial head
        const greaterRequests = sortedRequests.filter((req) => req.position >= head)
        // Find requests less than initial head
        const lesserRequests = sortedRequests.filter((req) => req.position < head)
  
        // Process requests in increasing order first
        greaterRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
  
        // Add the end of disk
        if (greaterRequests.length > 0 || lesserRequests.length > 0) {
          seekTime += Math.abs(head - maxRange)
          head = maxRange
          newSequence.push(head)
  
          // Jump to beginning of disk
          seekTime += maxRange // This is a simplification, in reality the head would move back to 0
          head = 0
          newSequence.push(head)
        }
  
        // Process requests in increasing order from beginning
        lesserRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
      } else if (algorithm === "look") {
        // LOOK Algorithm (like SCAN but doesn't go to the end)
        // Sort requests by position
        const sortedRequests = [...newRequests].sort((a, b) => a.position - b.position)
  
        // Find requests greater than or equal to initial head
        const greaterRequests = sortedRequests.filter((req) => req.position >= head)
        // Find requests less than initial head
        const lesserRequests = sortedRequests.filter((req) => req.position < head)
  
        // Process requests in increasing order first
        greaterRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
  
        // Process requests in decreasing order
        lesserRequests.reverse().forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
      } else if (algorithm === "clook") {
        // C-LOOK Algorithm (like C-SCAN but doesn't go to the end)
        // Sort requests by position
        const sortedRequests = [...newRequests].sort((a, b) => a.position - b.position)
  
        // Find requests greater than or equal to initial head
        const greaterRequests = sortedRequests.filter((req) => req.position >= head)
        // Find requests less than initial head
        const lesserRequests = sortedRequests.filter((req) => req.position < head)
  
        // Process requests in increasing order first
        greaterRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position)
          head = request.position
          newSequence.push(head)
        })
  
        // If there are any lesser requests, jump to the lowest request
        if (lesserRequests.length > 0) {
          const lowestRequest = lesserRequests[0]
          seekTime += Math.abs(head - lowestRequest.position)
          head = lowestRequest.position
          newSequence.push(head)
  
          // Process remaining lesser requests
          for (let i = 1; i < lesserRequests.length; i++) {
            seekTime += Math.abs(head - lesserRequests[i].position)
            head = lesserRequests[i].position
            newSequence.push(head)
          }
        }
      } else if (algorithm === "wscan") {
        // Weighted SCAN Algorithm
        // Create weighted requests
        const weightedRequests = newRequests.map((req, index) => ({
          ...req,
          weight: weights[index] || 1,
          weightedPosition: req.position * (weights[index] || 1),
        }))
  
        // Sort by weighted position
        const sortedRequests = [...weightedRequests].sort((a, b) => a.weightedPosition - b.weightedPosition)
  
        // Find requests greater than or equal to initial head
        const greaterRequests = sortedRequests.filter((req) => req.position >= head)
        // Find requests less than initial head
        const lesserRequests = sortedRequests.filter((req) => req.position < head)
  
        // Process requests in increasing order first, considering weights
        greaterRequests.forEach((request) => {
          seekTime += Math.abs(head - request.position) * request.weight
          head = request.position
          newSequence.push(head)
        })
  
        // Process requests in decreasing order, considering weights
        lesserRequests.reverse().forEach((request) => {
          seekTime += Math.abs(head - request.position) * request.weight
          head = request.position
          newSequence.push(head)
        })
      } else if (algorithm === "nscan") {
        // N-Step SCAN Algorithm
        // Divide requests into batches of size N
        const batches = []
        const requestsCopy = [...newRequests]
  
        while (requestsCopy.length > 0) {
          batches.push(requestsCopy.splice(0, nValue))
        }
  
        // Process each batch using SCAN
        batches.forEach((batch) => {
          // Sort batch by position
          const sortedBatch = [...batch].sort((a, b) => a.position - b.position)
  
          // Find requests greater than or equal to current head
          const greaterRequests = sortedBatch.filter((req) => req.position >= head)
          // Find requests less than current head
          const lesserRequests = sortedBatch.filter((req) => req.position < head)
  
          // Process in increasing order first
          greaterRequests.forEach((request) => {
            seekTime += Math.abs(head - request.position)
            head = request.position
            newSequence.push(head)
          })
  
          // Process in decreasing order
          lesserRequests.reverse().forEach((request) => {
            seekTime += Math.abs(head - request.position)
            head = request.position
            newSequence.push(head)
          })
        })
      }
  
      sequence = newSequence
      totalSeekTimeValue = seekTime
      averageSeekTimeValue = seekTime / requests.length
  
      // Update UI
      updateResults()
    }
  
    // Update results display
    function updateResults() {
      sequenceResult.textContent = sequence.length > 1 ? sequence.join(" → ") : "Not calculated yet"
      totalSeekTime.textContent = totalSeekTimeValue.toString()
      averageSeekTime.textContent = averageSeekTimeValue.toFixed(2)
  
      // Enable export button if we have results
      exportBtn.disabled = sequence.length <= 1
    }
  
    // Draw disk visualization
    function drawDiskVisualization() {
      const width = diskCanvas.width
      const height = diskCanvas.height
  
      // Clear canvas with a gradient background for better visibility
      const gradient = diskCtx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.9)")
      gradient.addColorStop(1, "rgba(20, 20, 30, 0.9)")
      diskCtx.fillStyle = gradient
      diskCtx.fillRect(0, 0, width, height)
  
      // Draw disk track with glow effect
      const trackY = height / 2
      const trackPadding = 50
  
      diskCtx.beginPath()
      diskCtx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      diskCtx.lineWidth = 3
      diskCtx.shadowBlur = 10
      diskCtx.shadowColor = "rgba(150, 150, 255, 0.5)"
      diskCtx.moveTo(trackPadding, trackY)
      diskCtx.lineTo(width - trackPadding, trackY)
      diskCtx.stroke()
      diskCtx.shadowBlur = 0
  
      // Draw track markers with better visibility
      diskCtx.fillStyle = "rgba(255, 255, 255, 0.8)"
      diskCtx.font = "bold 12px Arial"
      diskCtx.textAlign = "center"
  
      // Start marker
      diskCtx.fillText("0", trackPadding, trackY + 25)
  
      // End marker
      diskCtx.fillText(maxRange.toString(), width - trackPadding, trackY + 25)
  
      // Middle marker
      const middleX = trackPadding + (width - 2 * trackPadding) / 2
      diskCtx.fillText((maxRange / 2).toString(), middleX, trackY + 25)
  
      // Draw requests with glow effect
      const getXPosition = (position) => {
        return trackPadding + (position / maxRange) * (width - 2 * trackPadding)
      }
  
      requests.forEach((request, index) => {
        const x = getXPosition(request.position)
  
        // Draw request marker with glow
        diskCtx.beginPath()
        diskCtx.shadowBlur = 15
        diskCtx.shadowColor = request.color
        diskCtx.fillStyle = request.color
        diskCtx.arc(x, trackY, 8, 0, Math.PI * 2)
        diskCtx.fill()
        diskCtx.shadowBlur = 0
  
        // Draw request position with better contrast
        diskCtx.fillStyle = "white"
        diskCtx.font = "bold 10px Arial"
        diskCtx.textAlign = "center"
  
        // Add background for text
        const posText = request.position.toString()
        const textWidth = diskCtx.measureText(posText).width
        diskCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
        diskCtx.fillRect(x - textWidth / 2 - 2, trackY - 25, textWidth + 4, 16)
  
        diskCtx.fillStyle = "white"
        diskCtx.fillText(posText, x, trackY - 15)
  
        // Draw weight for Weighted SCAN
        if (algorithm === "wscan" && weights[index]) {
          const weightText = `w:${weights[index]}`
          const weightWidth = diskCtx.measureText(weightText).width
          diskCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
          diskCtx.fillRect(x - weightWidth / 2 - 2, trackY - 45, weightWidth + 4, 16)
  
          diskCtx.fillStyle = "rgba(255, 255, 255, 0.7)"
          diskCtx.fillText(weightText, x, trackY - 35)
        }
      })
  
      // Draw head position with enhanced visibility
      const headX = getXPosition(currentHead)
  
      // Draw head with glow effect
      diskCtx.beginPath()
      diskCtx.shadowBlur = 20
      diskCtx.shadowColor = "#ff00ff"
      diskCtx.fillStyle = "#ff00ff"
      diskCtx.arc(headX, trackY, 10, 0, Math.PI * 2)
      diskCtx.fill()
      diskCtx.shadowBlur = 0
  
      // Draw head position text with background
      const headText = currentHead.toString()
      const headTextWidth = diskCtx.measureText(headText).width
      diskCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
      diskCtx.fillRect(headX - headTextWidth / 2 - 5, trackY + 30, headTextWidth + 10, 20)
  
      diskCtx.fillStyle = "white"
      diskCtx.font = "bold 12px Arial"
      diskCtx.textAlign = "center"
      diskCtx.fillText(headText, headX, trackY + 45)
  
      // Draw head line with glow
      diskCtx.beginPath()
      diskCtx.shadowBlur = 10
      diskCtx.shadowColor = "#ff00ff"
      diskCtx.strokeStyle = "#ff00ff"
      diskCtx.lineWidth = 3
      diskCtx.moveTo(headX, trackY - 30)
      diskCtx.lineTo(headX, trackY + 30)
      diskCtx.stroke()
      diskCtx.shadowBlur = 0
  
      // Draw path if we have a sequence
      if (sequence.length > 1 && currentStep > 0) {
        diskCtx.beginPath()
        diskCtx.strokeStyle = "rgba(255, 0, 255, 0.7)"
        diskCtx.lineWidth = 3
        diskCtx.shadowBlur = 5
        diskCtx.shadowColor = "rgba(255, 0, 255, 0.5)"
  
        const startX = getXPosition(sequence[0])
        diskCtx.moveTo(startX, trackY)
  
        for (let i = 1; i <= currentStep; i++) {
          const x = getXPosition(sequence[i])
          diskCtx.lineTo(x, trackY)
        }
  
        diskCtx.stroke()
        diskCtx.shadowBlur = 0
      }
  
      // Add algorithm name and current step info
      if (sequence.length > 1) {
        const algoText = `Algorithm: ${algorithm.toUpperCase()} - Step ${currentStep}/${sequence.length - 1}`
        diskCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
        diskCtx.fillRect(10, 10, diskCtx.measureText(algoText).width + 20, 25)
  
        diskCtx.fillStyle = "white"
        diskCtx.font = "bold 14px Arial"
        diskCtx.textAlign = "left"
        diskCtx.fillText(algoText, 20, 27)
      }
    }
  
    // Draw step-by-step visualization
    function drawStepVisualization() {
      const width = stepCanvas.width
      const height = stepCanvas.height
      const padding = 40
      const timelineHeight = height - 140 // Reduced to make room for explanation text at bottom
  
      // Clear canvas
      stepCtx.clearRect(0, 0, width, height)
  
      // Draw timeline
      const timelineY = 50
      const timelineWidth = width - padding * 2
  
      stepCtx.beginPath()
      stepCtx.strokeStyle = "rgba(255, 255, 255, 0.2)"
      stepCtx.lineWidth = 2
      stepCtx.moveTo(padding, timelineY)
      stepCtx.lineTo(width - padding, timelineY)
      stepCtx.stroke()
  
      // Draw position markers
      stepCtx.fillStyle = "rgba(255, 255, 255, 0.5)"
      stepCtx.font = "10px Arial"
      stepCtx.textAlign = "center"
  
      // Draw markers at 0, 25%, 50%, 75%, and 100% of maxRange
      for (let i = 0; i <= 4; i++) {
        const x = padding + timelineWidth * (i / 4)
        const value = Math.floor((maxRange * i) / 4)
  
        stepCtx.beginPath()
        stepCtx.moveTo(x, timelineY - 5)
        stepCtx.lineTo(x, timelineY + 5)
        stepCtx.stroke()
  
        stepCtx.fillText(value.toString(), x, timelineY - 10)
      }
  
      // Draw all requests on timeline
      requests.forEach((request) => {
        const x = padding + (request.position / maxRange) * timelineWidth
  
        stepCtx.beginPath()
        stepCtx.fillStyle = request.color
        stepCtx.arc(x, timelineY, 5, 0, Math.PI * 2)
        stepCtx.fill()
      })
  
      // If we have a sequence, draw the path
      if (sequence.length > 1) {
        // Calculate time positions
        const timePositions = []
        const stepHeight = timelineHeight / (sequence.length - 1)
  
        for (let i = 0; i < sequence.length; i++) {
          const position = sequence[i]
          const x = padding + (position / maxRange) * timelineWidth
          const y = 80 + i * stepHeight
  
          timePositions.push({ x, y, position })
        }
  
        // Draw connecting lines
        stepCtx.beginPath()
        stepCtx.strokeStyle = getAlgorithmColor(algorithm)
        stepCtx.lineWidth = 2
  
        stepCtx.moveTo(timePositions[0].x, timelineY)
  
        for (let i = 0; i < timePositions.length; i++) {
          const { x, y } = timePositions[i]
          stepCtx.lineTo(x, y)
  
          // Highlight current step
          if (i === currentStep) {
            stepCtx.stroke()
            stepCtx.beginPath()
            stepCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"
            stepCtx.moveTo(x, y)
          }
        }
  
        stepCtx.stroke()
  
        // Draw position points and labels
        timePositions.forEach((pos, i) => {
          const isActive = i <= currentStep
          const radius = isActive ? 6 : 4
  
          // Draw point
          stepCtx.beginPath()
          stepCtx.fillStyle = isActive ? getAlgorithmColor(algorithm) : "rgba(255, 255, 255, 0.3)"
          stepCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
          stepCtx.fill()
  
          // Draw position label with better positioning
          stepCtx.fillStyle = isActive ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)"
          stepCtx.font = isActive ? "bold 12px Arial" : "10px Arial"
          stepCtx.textAlign = "left"
          stepCtx.fillText(pos.position.toString(), pos.x + 10, pos.y + 4)
  
          // Draw step number with better positioning and background
          if (i > 0) {
            // Add background for step number
            const stepText = `Step ${i}`
            const textWidth = stepCtx.measureText(stepText).width
  
            stepCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
            stepCtx.fillRect(pos.x - textWidth - 15, pos.y - 8, textWidth + 10, 16)
  
            stepCtx.fillStyle = isActive ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)"
            stepCtx.textAlign = "right"
            stepCtx.fillText(stepText, pos.x - 10, pos.y + 4)
          }
        })
  
        // Draw algorithm explanation at the bottom of the canvas
        const explanation = getAlgorithmExplanation(algorithm, currentStep, sequence)
        if (explanation) {
          // Add semi-transparent background for text
          const textMetrics = stepCtx.measureText(explanation)
          const textWidth = Math.min(textMetrics.width, width - 20)
          const textHeight = 20
          const textX = width / 2
          const textY = height - 20
  
          stepCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
          stepCtx.fillRect(textX - textWidth / 2 - 10, textY - textHeight - 5, textWidth + 20, textHeight + 10)
  
          // Draw text
          stepCtx.fillStyle = "rgba(255, 255, 255, 0.9)"
          stepCtx.font = "12px Arial"
          stepCtx.textAlign = "center"
          stepCtx.fillText(explanation, textX, textY)
        }
      } else {
        // No sequence yet
        stepCtx.fillStyle = "rgba(255, 255, 255, 0.5)"
        stepCtx.font = "14px Arial"
        stepCtx.textAlign = "center"
        stepCtx.fillText("Start the simulation to see the step-by-step visualization", width / 2, height / 2)
      }
    }
  
    // Helper function to get color based on algorithm
    function getAlgorithmColor(alg) {
      switch (alg) {
        case "fcfs":
          return "rgba(168, 85, 247, 0.8)" // purple
        case "scan":
          return "rgba(34, 211, 238, 0.8)" // cyan
        case "sstf":
          return "rgba(244, 114, 182, 0.8)" // pink
        case "cscan":
          return "rgba(59, 130, 246, 0.8)" // blue
        case "look":
          return "rgba(245, 158, 11, 0.8)" // amber
        case "clook":
          return "rgba(16, 185, 129, 0.8)" // emerald
        case "wscan":
          return "rgba(236, 72, 153, 0.8)" // pink-600
        case "nscan":
          return "rgba(139, 92, 246, 0.8)" // violet-500
        default:
          return "rgba(255, 255, 255, 0.8)"
      }
    }
  
    // Helper function to get explanation based on algorithm and step
    function getAlgorithmExplanation(alg, step, seq) {
      if (step === 0 || seq.length <= 1) return ""
  
      const prev = seq[step - 1]
      const current = seq[step]
      const distance = Math.abs(current - prev)
  
      switch (alg) {
        case "fcfs":
          return `FCFS: Moving from position ${prev} to ${current} (distance: ${distance}) - servicing requests in arrival order`
        case "scan":
          if (step === seq.length - 1 && seq[step] === 0) {
            return `SCAN: Reached end of disk, reversing direction to position ${current}`
          } else if (step > 0 && seq[step] > seq[step - 1]) {
            return `SCAN: Moving from position ${prev} to ${current} (distance: ${distance}) - moving toward higher positions`
          } else {
            return `SCAN: Moving from position ${prev} to ${current} (distance: ${distance}) - moving toward lower positions`
          }
        case "sstf":
          return `SSTF: Moving from position ${prev} to ${current} (distance: ${distance}) - choosing closest request`
        case "cscan":
          if (step > 0 && current < prev && prev === maxRange) {
            return `C-SCAN: Reached end of disk, moving back to position ${current} from beginning`
          } else {
            return `C-SCAN: Moving from position ${prev} to ${current} (distance: ${distance}) - moving in one direction`
          }
        case "look":
          if (step > 0 && ((prev > current && seq[step - 2] < prev) || (prev < current && seq[step - 2] > prev))) {
            return `LOOK: Changing direction at position ${prev}, moving to ${current} (distance: ${distance})`
          } else {
            return `LOOK: Moving from position ${prev} to ${current} (distance: ${distance})`
          }
        case "clook":
          if (step > 0 && current < prev && prev === Math.max(...seq.slice(0, step + 1))) {
            return `C-LOOK: Reached highest request, moving to lowest request at position ${current}`
          } else {
            return `C-LOOK: Moving from position ${prev} to ${current} (distance: ${distance}) - moving in one direction`
          }
        case "wscan":
          return `Weighted SCAN: Moving from position ${prev} to ${current} (distance: ${distance}) - prioritizing by weight and direction`
        case "nscan":
          return `N-Step SCAN: Moving from position ${prev} to ${current} (distance: ${distance}) - processing requests in batches`
        default:
          return ""
      }
    }
  
    // Start animation
    function startAnimation() {
      if (sequence.length <= 1) {
        calculateSequence()
        return
      }
  
      isAnimating = true
      lastTime = performance.now()
      pauseBtn.disabled = false
      startBtn.disabled = true
  
      if (currentStep >= sequence.length - 1) {
        currentStep = 0
        currentHead = sequence[0]
      }
  
      animate()
    }
  
    // Stop animation
    function stopAnimation() {
      isAnimating = false
      pauseBtn.disabled = true
      startBtn.disabled = false
  
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  
    // Reset animation
    function resetAnimation() {
      stopAnimation()
      currentStep = 0
      currentHead = sequence[0] || initialHead
      drawDiskVisualization()
      drawStepVisualization()
    }
  
    // Animation loop
    function animate(timestamp) {
      if (!isAnimating) return
  
      timestamp = timestamp || performance.now()
      const deltaTime = timestamp - lastTime
  
      // Only update if enough time has passed based on animation speed
      if (deltaTime > 1000 / animationSpeed) {
        lastTime = timestamp
  
        if (currentStep < sequence.length - 1) {
          currentStep++
          currentHead = sequence[currentStep]
          drawDiskVisualization()
          drawStepVisualization()
        } else {
          stopAnimation()
          return
        }
      }
  
      animationId = requestAnimationFrame(animate)
    }
  
    // Generate PDF report
    function generateReport() {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF()
  
      // Add title
      doc.setFontSize(20)
      doc.text("Disk Scheduling Algorithm Report", 20, 20)
  
      // Add algorithm info
      doc.setFontSize(14)
      doc.text(`Algorithm: ${algorithm.toUpperCase()}`, 20, 40)
      doc.text(`Disk Range: 0 - ${maxRange}`, 20, 50)
      doc.text(`Initial Head Position: ${initialHead}`, 20, 60)
  
      // Add request info
      doc.text("Request Queue:", 20, 70)
      doc.text(requestInput, 20, 80)
  
      // Add results
      doc.text("Results:", 20, 100)
      doc.text(`Sequence: ${sequence.join(" → ")}`, 20, 110)
      doc.text(`Total Seek Time: ${totalSeekTimeValue}`, 20, 120)
      doc.text(`Average Seek Time: ${averageSeekTimeValue.toFixed(2)}`, 20, 130)
  
      // Save the PDF
      doc.save(`disk-scheduling-${algorithm}-report.pdf`)
    }
  
    // Event listeners
    algorithmSelect.addEventListener("change", function () {
      algorithm = this.value
  
      // Show/hide N-Value input for N-Step SCAN
      if (algorithm === "nscan") {
        nValueGroup.classList.remove("hidden")
      } else {
        nValueGroup.classList.add("hidden")
      }
  
      calculateSequence()
      drawDiskVisualization()
      drawStepVisualization()
    })
  
    maxRangeInput.addEventListener("change", function () {
      maxRange = Number.parseInt(this.value) || 200
      maxRangeValue.textContent = maxRange
      maxHeadValue.textContent = maxRange
      initialHeadInput.max = maxRange
  
      parseRequests()
      calculateSequence()
      drawDiskVisualization()
      drawStepVisualization()
    })
  
    initialHeadInput.addEventListener("change", function () {
      initialHead = Number.parseInt(this.value) || 0
      if (initialHead > maxRange) {
        initialHead = maxRange
        this.value = maxRange
      }
  
      parseRequests()
      calculateSequence()
      drawDiskVisualization()
      drawStepVisualization()
    })
  
    requestsInput.addEventListener("change", function () {
      requestInput = this.value
      parseRequests()
      calculateSequence()
      drawDiskVisualization()
      drawStepVisualization()
    })
  
    nValueInput.addEventListener("change", function () {
      nValue = Number.parseInt(this.value) || 3
      if (algorithm === "nscan") {
        calculateSequence()
        drawDiskVisualization()
        drawStepVisualization()
      }
    })
  
    speedInput.addEventListener("input", function () {
      animationSpeed = Number.parseFloat(this.value)
    })
  
    startBtn.addEventListener("click", startAnimation)
    pauseBtn.addEventListener("click", stopAnimation)
    resetBtn.addEventListener("click", resetAnimation)
    exportBtn.addEventListener("click", generateReport)
  
    // Handle window resize
    window.addEventListener("resize", () => {
      initializeCanvases()
      drawDiskVisualization()
      drawStepVisualization()
    })
  
    // Initialize
    initializeCanvases()
    parseRequests()
    calculateSequence()
    drawDiskVisualization()
    drawStepVisualization()
  })
  
  
package com.ecg.classifier

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

class EcgWaveformView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var signal: FloatArray? = null
    private var highlightStart = -1
    private var highlightEnd = -1
    private var highlightColor = Color.parseColor("#40E8602C")

    private val gridPaint = Paint().apply {
        color = Color.parseColor("#E8E8ED")
        strokeWidth = 1f
        style = Paint.Style.STROKE
    }

    private val linePaint = Paint().apply {
        color = Color.parseColor("#E8602C")
        strokeWidth = 3f
        style = Paint.Style.STROKE
        isAntiAlias = true
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
    }

    private val glowPaint = Paint().apply {
        color = Color.parseColor("#40E8602C")
        strokeWidth = 8f
        style = Paint.Style.STROKE
        isAntiAlias = true
        strokeJoin = Paint.Join.ROUND
        maskFilter = BlurMaskFilter(6f, BlurMaskFilter.Blur.NORMAL)
    }

    private val fillPaint = Paint().apply {
        isAntiAlias = true
        style = Paint.Style.FILL
    }

    private val highlightPaint = Paint().apply {
        isAntiAlias = true
        style = Paint.Style.FILL
    }

    private val path = Path()
    private val fillPath = Path()

    fun setSignal(data: FloatArray) {
        signal = data
        highlightStart = -1
        highlightEnd = -1
        invalidate()
    }

    fun clearSignal() {
        signal = null
        highlightStart = -1
        highlightEnd = -1
        invalidate()
    }

    /**
     * Highlight the region of the signal that was most important for classification.
     * Finds the peak area automatically from the signal.
     */
    fun highlightPeak(classColor: Int) {
        val data = signal ?: return
        if (data.isEmpty()) return

        // Find the most prominent peak region (highest absolute deviation)
        val mean = data.average().toFloat()
        var maxScore = 0f
        var bestStart = 0
        val windowSize = (data.size * 0.25f).toInt().coerceAtLeast(15) // ~25% of signal

        for (start in 0..(data.size - windowSize)) {
            var score = 0f
            for (j in start until start + windowSize) {
                score += Math.abs(data[j] - mean)
            }
            if (score > maxScore) {
                maxScore = score
                bestStart = start
            }
        }

        highlightStart = bestStart
        highlightEnd = (bestStart + windowSize).coerceAtMost(data.size - 1)
        highlightColor = (classColor and 0x00FFFFFF) or 0x30000000 // 19% opacity
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val w = width.toFloat()
        val h = height.toFloat()
        val padH = 16f
        val padV = 20f

        // Grid
        val gridSpacingX = w / 10f
        val gridSpacingY = h / 6f
        for (i in 1..9) canvas.drawLine(i * gridSpacingX, 0f, i * gridSpacingX, h, gridPaint)
        for (i in 1..5) canvas.drawLine(0f, i * gridSpacingY, w, i * gridSpacingY, gridPaint)

        val data = signal ?: return
        if (data.isEmpty()) return

        val minVal = data.min()
        val maxVal = data.max()
        val range = maxVal - minVal
        if (range < 1e-8f) return

        val drawW = w - 2 * padH
        val drawH = h - 2 * padV
        val stepX = drawW / (data.size - 1).coerceAtLeast(1)

        // Highlight region
        if (highlightStart >= 0 && highlightEnd > highlightStart) {
            val hx1 = padH + highlightStart * stepX
            val hx2 = padH + highlightEnd * stepX
            highlightPaint.color = highlightColor
            canvas.drawRoundRect(hx1, padV * 0.5f, hx2, h - padV * 0.5f, 12f, 12f, highlightPaint)
        }

        // Build path
        path.reset()
        fillPath.reset()
        for (i in data.indices) {
            val x = padH + i * stepX
            val normY = (data[i] - minVal) / range
            val y = padV + drawH * (1f - normY)
            if (i == 0) {
                path.moveTo(x, y); fillPath.moveTo(x, h); fillPath.lineTo(x, y)
            } else {
                path.lineTo(x, y); fillPath.lineTo(x, y)
            }
        }
        fillPath.lineTo(padH + (data.size - 1) * stepX, h)
        fillPath.close()

        // Gradient fill
        fillPaint.shader = LinearGradient(
            0f, padV, 0f, h,
            Color.parseColor("#20E8602C"), Color.parseColor("#00E8602C"),
            Shader.TileMode.CLAMP
        )
        canvas.drawPath(fillPath, fillPaint)
        canvas.drawPath(path, glowPaint)
        canvas.drawPath(path, linePaint)
    }
}

package com.ecg.classifier

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.DecelerateInterpolator

/**
 * Circular ring view showing 5 class probabilities as colored arc segments.
 * Center displays the classification letter.
 */
class ClassificationRingView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    private val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 28f
        strokeCap = Paint.Cap.ROUND
    }

    private val bgRingPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 28f
        color = Color.parseColor("#F0E8D8")
    }

    private val letterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
        color = Color.parseColor("#1A1A2E")
    }

    private val subtitlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        color = Color.parseColor("#6E6E82")
    }

    private val arcRect = RectF()

    // Data
    private var probabilities = floatArrayOf()
    private var classLetter = ""
    private var className = ""
    private var animationProgress = 0f

    private val classColors = listOf(
        Color.parseColor("#34C759"),  // N - green
        Color.parseColor("#FFD060"),  // S - yellow
        Color.parseColor("#FF6B6B"),  // V - red/pink
        Color.parseColor("#FF9500"),  // F - orange
        Color.parseColor("#B8A8D0")   // Q - lavender
    )

    fun setResult(probs: FloatArray, letter: String, name: String) {
        probabilities = probs
        classLetter = letter
        className = name

        // Animate
        ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1000
            interpolator = DecelerateInterpolator(1.5f)
            addUpdateListener {
                animationProgress = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    fun clear() {
        probabilities = floatArrayOf()
        classLetter = ""
        className = ""
        animationProgress = 0f
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(cx, cy) - arcPaint.strokeWidth
        arcRect.set(cx - radius, cy - radius, cx + radius, cy + radius)

        // Background ring
        canvas.drawArc(arcRect, 0f, 360f, false, bgRingPaint)

        if (probabilities.isEmpty()) return

        // Draw probability arcs
        val gap = 6f // gap between segments in degrees
        val totalGap = gap * probabilities.size
        val totalAvailable = 360f - totalGap
        var startAngle = -90f // start from top

        probabilities.forEachIndexed { i, prob ->
            val sweep = (prob * totalAvailable * animationProgress)
            if (sweep > 1f) {
                arcPaint.color = classColors[i % classColors.size]
                canvas.drawArc(arcRect, startAngle, sweep, false, arcPaint)
            }
            startAngle += sweep + gap
        }

        // Center letter
        if (classLetter.isNotEmpty()) {
            letterPaint.textSize = radius * 0.55f
            letterPaint.alpha = (255 * animationProgress).toInt()
            val letterY = cy - (letterPaint.descent() + letterPaint.ascent()) / 2f
            canvas.drawText(classLetter, cx, letterY, letterPaint)

            // Subtitle (class name)
            subtitlePaint.textSize = radius * 0.14f
            subtitlePaint.alpha = (255 * animationProgress).toInt()
            canvas.drawText(className, cx, letterY + radius * 0.28f, subtitlePaint)
        }
    }
}

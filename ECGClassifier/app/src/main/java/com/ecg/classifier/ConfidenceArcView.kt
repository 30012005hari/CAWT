package com.ecg.classifier

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.OvershootInterpolator

/**
 * Circular arc gauge showing classification confidence.
 * Animated fill with a smooth spring effect.
 */
class ConfidenceArcView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var progress = 0f  // 0..1
    private var displayProgress = 0f
    private var label = ""
    private var arcColor = Color.parseColor("#E8602C")

    private val bgArcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 10f
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#F0F0F3")
    }

    private val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 10f
        strokeCap = Paint.Cap.ROUND
    }

    private val glowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 16f
        strokeCap = Paint.Cap.ROUND
        maskFilter = BlurMaskFilter(8f, BlurMaskFilter.Blur.NORMAL)
    }

    private val percentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#1A1A2E")
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
    }

    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#6B6B80")
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    }

    private val rect = RectF()

    fun setConfidence(value: Float, className: String, color: Int) {
        progress = value.coerceIn(0f, 1f)
        label = className
        arcColor = color

        // Animate with spring overshoot
        ValueAnimator.ofFloat(0f, progress).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
            addUpdateListener {
                displayProgress = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val cx = width / 2f
        val cy = height / 2f
        val strokeW = bgArcPaint.strokeWidth
        val radius = (minOf(width, height) / 2f) - strokeW - 12f

        rect.set(cx - radius, cy - radius, cx + radius, cy + radius)

        // Background arc (270 degrees, gap at bottom)
        canvas.drawArc(rect, 135f, 270f, false, bgArcPaint)

        // Glow arc
        glowPaint.color = Color.argb(50, Color.red(arcColor), Color.green(arcColor), Color.blue(arcColor))
        val sweepAngle = displayProgress * 270f
        canvas.drawArc(rect, 135f, sweepAngle, false, glowPaint)

        // Main arc
        arcPaint.color = arcColor
        canvas.drawArc(rect, 135f, sweepAngle, false, arcPaint)

        // Percentage text
        percentPaint.textSize = radius * 0.55f
        val pct = "${(displayProgress * 100).toInt()}%"
        canvas.drawText(pct, cx, cy + percentPaint.textSize * 0.15f, percentPaint)

        // Label below percentage
        labelPaint.textSize = radius * 0.22f
        canvas.drawText(label, cx, cy + percentPaint.textSize * 0.15f + labelPaint.textSize * 1.6f, labelPaint)
    }
}

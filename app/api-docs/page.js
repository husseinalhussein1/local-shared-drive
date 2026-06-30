"use client"

import { useEffect, useRef, useState } from 'react'

const API_SPEC_URL = '/api-docs/openapi.json'

export default function ApiDocsPage() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const uiRef = useRef(null)

  useEffect(() => {
    let mounted = true
    let swaggerInstance = null

    async function initializeSwagger() {
      try {
        const response = await fetch(API_SPEC_URL, { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`Failed to load OpenAPI spec: ${response.status} ${response.statusText}`)
        }

        const spec = await response.json()
        const { SwaggerUIBundle, SwaggerUIStandalonePreset } = await import('swagger-ui-dist')

        if (!mounted || !uiRef.current) {
          return
        }

        uiRef.current.innerHTML = ''

        swaggerInstance = SwaggerUIBundle({
          domNode: uiRef.current,
          spec,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          withCredentials: true,
          docExpansion: 'list',
          deepLinking: false,
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options'],
          requestInterceptor: (req) => {
            req.credentials = 'include'
            return req
          },
        })

        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading API specification.')
          setLoading(false)
        }
      }
    }

    initializeSwagger()

    return () => {
      mounted = false
      if (swaggerInstance && typeof swaggerInstance.destroy === 'function') {
        swaggerInstance.destroy()
      }
    }
  }, [])

  return (
    <main className="min-h-screen py-10 px-4 sm:px-8 lg:px-12 bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1400px]">
        <div className="p-6 rounded-[32px] border border-slate-200/70 bg-white shadow-sm mb-8">
          <h1 className="text-3xl font-semibold mb-3">توثيق الـ API التفاعلي</h1>
          <p className="text-sm leading-7 text-slate-600 max-w-3xl">
            هذه الصفحة تعرض المواصفات التفاعلية لكل مسار API موجود في المشروع.
            يمكنك تجربة المسارات مباشرة باستخدام زر <strong>Try it out</strong>
            وإرسال الكوكيز تلقائياً عند الطلبات بعد تسجيل الدخول.
          </p>
          <p className="mt-4 text-sm text-slate-600 max-w-3xl">
            أولاً، استخدم <code>POST /api/auth/login</code> لتسجيل الدخول ثم
            جرّب المسارات المحمية مثل <code>POST /api/admin/users/create</code> و
            <code>GET /api/admin/logs</code> بدون الخروج من المتصفح.
          </p>
        </div>

        {error ? (
          <div className="p-6 rounded-[32px] border border-red-500/20 bg-red-50 text-red-800">
            <h2 className="text-xl font-semibold">خطأ في تحميل التوثيق</h2>
            <p className="mt-3 text-sm leading-7">{error}</p>
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-200/70 bg-white shadow-sm min-h-[72vh] p-4">
            {loading && <div className="text-slate-600">جاري تحميل صفحة التوثيق...</div>}
            <div ref={uiRef} />
          </div>
        )}
      </div>
      <style jsx global>{`
        .swagger-ui {
          background: #f8fafc;
          color: #0f172a;
        }
        .swagger-ui .topbar {
          background: #ffffff;
          border-bottom-color: rgba(148, 163, 184, 0.25);
        }
        .swagger-ui .topbar .link {
          color: #0284c7;
        }
        .swagger-ui .info {
          background: #ffffff;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .swagger-ui .scheme-container,
        .swagger-ui .opblock,
        .swagger-ui .responses-wrapper,
        .swagger-ui .response-col_description,
        .swagger-ui .parameters {
          background: #ffffff;
          color: #0f172a;
        }
        .swagger-ui .opblock-summary {
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .swagger-ui .opblock-summary-method {
          color: #0284c7;
        }
        .swagger-ui .opblock-summary-path {
          color: #0f172a;
        }
        .swagger-ui .response-col_status {
          background: rgba(15, 23, 42, 0.05);
        }
        .swagger-ui .btn, .swagger-ui button {
          background: linear-gradient(90deg, #38bdf8, #0ea5e9);
          color: #ffffff;
        }
        .swagger-ui .btn:hover, .swagger-ui button:hover {
          opacity: 0.95;
        }
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type,
        .swagger-ui .parameter__description {
          color: #0f172a;
        }
      `}</style>
    </main>
  )
}

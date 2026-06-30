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
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lumina Network API</h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              مستندات برمجية منظمة ومقسمة حسب الصلاحيات والوظائف لإدارة الملفات والمجلدات.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              OpenAPI 3.0
            </span>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/20">
              v1.0.0
            </span>
          </div>
        </header>

        {/* Content Container */}
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {error ? (
            /* Modern Error State */
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center bg-red-50/20">
              <div className="rounded-full bg-red-100 p-3 text-red-600 ring-8 ring-red-50">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">حدث خطأ في تحميل التوثيق</h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">{error}</p>
            </div>
          ) : (
            <div className="min-h-[70vh] w-full p-2 sm:p-5">
              {loading && (
                /* Elegant Loading Spinner */
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">جاري تحميل وتصنيف مسارات الـ API...</p>
                </div>
              )}
              {/* Swagger UI Mount Node */}
              <div ref={uiRef} className="h-full w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Custom Global CSS For Premium Dashboard Look & Multi-Sections styling */}
      <style jsx global>{`
        .swagger-ui {
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          background-color: transparent !important;
        }
        .swagger-ui .info {
          margin: 15px 0 25px 0 !important;
          padding: 24px !important;
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
        }
        .swagger-ui .info .title {
          font-size: 24px !important;
          color: #0f172a !important;
        }
        
        /* Styles for Section Headers (Tags) */
        .swagger-ui .opblock-tag-section {
          background: #ffffff !important;
          border: 1px solid #f1f5f9 !important;
          border-radius: 16px !important;
          padding: 12px !important;
          margin-bottom: 20px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .swagger-ui .opblock-tag {
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          border-bottom: none !important;
          padding: 8px 4px !important;
        }
        .swagger-ui .opblock-tag small {
          color: #64748b !important;
          font-size: 13px !important;
          margin-left: 8px !important;
        }

        .swagger-ui .scheme-container {
          background: transparent !important;
          box-shadow: none !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          margin-bottom: 24px !important;
        }
        .swagger-ui .opblock {
          border-radius: 12px !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
          overflow: hidden !important;
          margin-bottom: 10px !important;
        }
        .swagger-ui .opblock .opblock-summary {
          padding: 12px 16px !important;
        }
        .swagger-ui .opblock .opblock-summary-path {
          font-family: ui-monospace, Consolas, monospace !important;
          font-weight: 600 !important;
          color: #1e293b !important;
        }
        .swagger-ui .btn {
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 6px 16px !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #334155 !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.15s ease;
        }
        .swagger-ui .btn:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        .swagger-ui .btn.execute {
          background: #0284c7 !important;
          border-color: #0284c7 !important;
          color: #ffffff !important;
        }
        .swagger-ui .btn.execute:hover {
          background: #0369a1 !important;
        }
        .swagger-ui select, 
        .swagger-ui input[type=text] {
          border: 1px solid #cbd5e1 !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
        }
        .swagger-ui .topbar {
          display: none !important;
        }
      `}</style>
    </main>
  )
}
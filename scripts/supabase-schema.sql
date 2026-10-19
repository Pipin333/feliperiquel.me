-- Esquema de base de datos para feliperiquel.me
-- Tabla: contact_messages (Persistencia de mensajes de contacto recibidos)

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices para busqueda y ordenamiento eficiente
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);

-- Politica de Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Permitir insercion publica anonima (para que la funcion serverless con anon key pueda insertar)
-- Si usas SUPABASE_SERVICE_ROLE_KEY desde el backend serverless, el rol de servicio bypass RLS automaticamente.
CREATE POLICY "Permitir insercion de nuevos mensajes" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Solo lectura autenticada (tu panel o rol de servicio)
CREATE POLICY "Permitir lectura solo a usuarios autorizados" 
ON public.contact_messages 
FOR SELECT 
USING (auth.role() = 'authenticated');

import { getUserId } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MIN_MINUTES_FOR_POINTS = 1;
const MIN_MINUTES_FOR_EXTENDED = 60;

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json(
            { error: 'No autenticado' },
            { status: 401 }
        );
    }
    const supabase = await createClient();
    const body = await request.json();
    const { active } = body;
    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: 'id es requerido' },
            { status: 400 }
        );
    }

    // Verificar que existe antes de actualizar
    const { data: existing, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', id)
        .single();

    if (checkError || !existing) {
        return NextResponse.json(
            { error: 'Check-in no encontrado' },
            { status: 404 }
        );
    }

    // Actualizar el check-in
    const { data, error } = await supabase
        .from('check_ins')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    // Lógica de puntos solo cuando se hace checkout (active: false)
    let points_earned = 0;

    if (active === false && existing.location_valid && !existing.points_awarded) {
        const createdAt = new Date(existing.created_at);
        const now = new Date();
        const durationMinutes = (now.getTime() - createdAt.getTime()) / 60000;

        const transactions: { profile_id: string; check_in_id: string; type: string; points: number }[] = [];

        if (durationMinutes >= MIN_MINUTES_FOR_POINTS) {
            transactions.push(
                { profile_id: existing.profile_id, check_in_id: id, type: 'checkin_validated', points: 5 },
                { profile_id: existing.profile_id, check_in_id: id, type: 'checkout_confirmed', points: 5 },
            );
            points_earned += 10;
        }

        if (durationMinutes >= MIN_MINUTES_FOR_EXTENDED) {
            transactions.push({
                profile_id: existing.profile_id, check_in_id: id, type: 'extended_stay', points: 10,
            });
            points_earned += 10;
        }

        if (transactions.length > 0) {
            await supabase.from('point_transactions').insert(transactions);

            // Leer puntos actuales y sumar
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('points')
                .eq('id', existing.profile_id)
                .single();

            await supabase
                .from('profiles')
                .update({ points: (currentProfile?.points ?? 0) + points_earned })
                .eq('id', existing.profile_id);

            // Marcar puntos como otorgados
            await supabase
                .from('check_ins')
                .update({ points_awarded: true })
                .eq('id', id);
        }
    }

    // Obtener total actualizado de puntos
    let total_points: number | null = null;
    if (points_earned > 0) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();
        total_points = profile?.points ?? null;
    }

    return NextResponse.json({ success: true, data, points_earned, total_points });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json(
            { error: 'No autenticado' },
            { status: 401 }
        );
    }
    const supabase = await createClient();
    const { id } = await params;
    if (!id) {
        return NextResponse.json(
            { error: 'id es requerido' },
            { status: 400 }
        );
    }
    // VERIFICAR QUE EXISTE ANTES DE ELIMINAR
    const { data: existing, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('venue_id', id)
        .eq('profile_id', userId)
        .single();
    if (checkError || !existing) {
        return NextResponse.json(
            { error: 'Check-in no encontrado' },
            { status: 404 }
        );
    }
    // INTENTAR ELIMINAR
    const { data, error } = await supabase
        .from('check_ins')
        .delete()
        .eq('venue_id', id)
        .eq('profile_id', userId)
        .select()
        .single();
    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }
    return NextResponse.json({ success: true, data });
}

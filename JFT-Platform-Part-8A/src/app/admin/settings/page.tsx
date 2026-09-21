import { createClient } from "@/lib/supabase/server";
import {
  setProfilePhotoEnabled,
  setWhatsappAutoApprove,
  updateWhatsappLink,
} from "@/lib/actions/settings";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .order("key");

  const { data: tasks } = await supabase
    .from("verification_tasks")
    .select("*")
    .order("sort_order");

  const settingMap = Object.fromEntries(
    (settings || []).map((s) => [s.key, s.value])
  );

  const photoOn =
    settingMap.profile_photo_enabled === true ||
    settingMap.profile_photo_enabled === "true";
  const whatsappAuto =
    settingMap.whatsapp_auto_approve === true ||
    settingMap.whatsapp_auto_approve === "true";

  const whatsappTask = tasks?.find((t) => t.task_type === "whatsapp");

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Profile photos</h2>
        <p className="text-sm text-slate-600">
          OFF = no Storage uploads. Users get a random avatar from their
          name/email. Saves free-tier storage.
        </p>
        <p className="text-sm">
          Current:{" "}
          <strong className={photoOn ? "text-green-600" : "text-amber-600"}>
            {photoOn ? "ON (uploads allowed)" : "OFF (random avatars)"}
          </strong>
        </p>
        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await setProfilePhotoEnabled(true);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
            >
              Enable uploads
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await setProfilePhotoEnabled(false);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg"
            >
              Disable (random avatar)
            </button>
          </form>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">WhatsApp verification</h2>
        <p className="text-sm text-slate-600">
          No screenshots are stored. Auto-approve = user taps I joined and is
          verified immediately (admin does not need to review).
        </p>
        <p className="text-sm">
          Auto-approve:{" "}
          <strong
            className={whatsappAuto ? "text-green-600" : "text-amber-600"}
          >
            {whatsappAuto ? "ON" : "OFF"}
          </strong>
        </p>
        <div className="flex gap-2 flex-wrap">
          <form
            action={async () => {
              "use server";
              await setWhatsappAutoApprove(true);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
            >
              Auto-approve ON
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await setWhatsappAutoApprove(false);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg"
            >
              Auto-approve OFF (manual)
            </button>
          </form>
        </div>

        <form
          action={async (fd: FormData) => {
            "use server";
            await updateWhatsappLink(String(fd.get("link") || ""));
          }}
          className="pt-2 space-y-2"
        >
          <label className="text-sm font-medium">WhatsApp group link</label>
          <input
            name="link"
            defaultValue={whatsappTask?.whatsapp_link || ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="https://chat.whatsapp.com/..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg"
          >
            Save link
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border p-5 space-y-2">
        <h2 className="font-semibold">Email (Gmail App Password)</h2>
        <p className="text-sm text-slate-600">
          Email is sent from your own Gmail via SMTP — not Supabase Auth email
          (avoids free-tier limits). Configure in .env.local
        </p>
        <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto">{`EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM="JFT Platform <your@gmail.com>"`}</pre>
        <p className="text-xs text-slate-500">
          Google Account → Security → 2-Step Verification → App passwords.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">All site_settings (read-only)</h2>
        <div className="bg-white rounded-xl border divide-y">
          {settings?.map((s) => (
            <div
              key={s.id}
              className="px-4 py-3 flex justify-between text-sm gap-4"
            >
              <div>
                <div className="font-medium">{s.key}</div>
                {s.description && (
                  <div className="text-xs text-slate-500">{s.description}</div>
                )}
              </div>
              <code className="text-xs bg-slate-50 px-2 py-1 rounded shrink-0">
                {JSON.stringify(s.value)}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-dashed border-amber-300 bg-amber-50 rounded-xl p-4 text-sm text-amber-900">
        <strong>Why no raw SQL in admin?</strong>
        <br />
        Allowing arbitrary SQL from the browser is dangerous (data wipe /
        privilege escalation). Use the toggles above. For one-off SQL, use
        Supabase Dashboard → SQL Editor (only you have access).
      </section>
    </div>
  );
}
